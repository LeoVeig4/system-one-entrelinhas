import json
import threading
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import Mock, patch

import requests

from sales_trainer.evaluator import Evaluator
from sales_trainer.scenarios import Catalog
from sales_trainer.server import LocalServer
from support import input_data, valid_result


class ServerTests(unittest.TestCase):
    def setUp(self):
        self.catalog = Catalog()
        response = Mock()
        response.json.return_value = valid_result(self.catalog.schema)
        self.post = Mock(return_value=response)
        self.server = LocalServer(("127.0.0.1", 0), Evaluator(self.catalog, post=self.post))
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.url = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def test_routes_and_complete_evaluation(self):
        result = requests.get(self.url + "/api/scenarios", timeout=5)
        self.assertEqual(len(result.json()["scenarios"]), 3)
        response = requests.post(self.url + "/api/evaluations", json=input_data(self.catalog), timeout=5)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["attempt_id"], "test-attempt")
        self.assertEqual(requests.get(self.url + "/pyproject.toml", timeout=5).status_code, 404)

    def test_invalid_and_busy_inputs(self):
        for data, code in [(input_data(self.catalog, ""), 400),
                           ({**input_data(self.catalog), "scenario_version": "old"}, 409)]:
            with self.subTest(code=code):
                response = requests.post(self.url + "/api/evaluations", json=data, timeout=5)
                self.assertEqual(response.status_code, code)
        self.post.assert_not_called()
        self.server.evaluation_lock.acquire()
        try:
            response = requests.post(self.url + "/api/evaluations", json=input_data(self.catalog), timeout=5)
            self.assertEqual(response.status_code, 409)
            self.assertEqual(response.json()["error"]["code"], "evaluation_busy")
            self.assertEqual(requests.get(self.url + "/api/scenarios", timeout=5).status_code, 200)
        finally:
            self.server.evaluation_lock.release()

    def test_invalid_json_and_body_size(self):
        response = requests.post(self.url + "/api/evaluations", data=b"not json",
                                 headers={"Content-Type": "application/json"}, timeout=5)
        self.assertEqual(response.status_code, 400)
        response = requests.post(self.url + "/api/evaluations", data=b"x" * 65537,
                                 headers={"Content-Type": "application/json"}, timeout=5)
        self.assertEqual(response.status_code, 413)

    def test_model_failure_releases_evaluation_lock(self):
        self.post.side_effect = requests.Timeout()
        response = requests.post(self.url + "/api/evaluations", json=input_data(self.catalog), timeout=5)
        self.assertEqual(response.status_code, 504)
        self.assertFalse(self.server.evaluation_lock.locked())
        self.post.side_effect = None
        response = requests.post(self.url + "/api/evaluations", json=input_data(self.catalog), timeout=5)
        self.assertEqual(response.status_code, 200)

    def test_react_routes_assets_and_missing_build(self):
        with TemporaryDirectory() as folder, patch("sales_trainer.server.FRONTEND_DIST", Path(folder)):
            response = requests.get(self.url + "/conceitos", timeout=5)
            self.assertEqual(response.status_code, 503)
            self.assertEqual(response.json()["error"]["code"], "frontend_not_built")
            self.assertEqual(requests.get(self.url + "/api/scenarios", timeout=5).status_code, 200)
            build = Path(folder)
            (build / "index.html").write_text('<div id="root">React</div>', encoding="utf-8")
            (build / "assets").mkdir()
            (build / "assets" / "app.js").write_text("console.log('react')", encoding="utf-8")
            for route in ("/", "/conceitos", "/conceitos?from=chat"):
                result = requests.get(self.url + route, timeout=5)
                self.assertEqual(result.status_code, 200)
                self.assertIn('id="root"', result.text)
            asset = requests.get(self.url + "/assets/app.js", timeout=5)
            self.assertEqual(asset.status_code, 200)
            self.assertIn("javascript", asset.headers["Content-Type"])
            for route in ("/assets/missing.js", "/assets/%2e%2e/%2e%2e/pyproject.toml", "/not-a-page"):
                self.assertEqual(requests.get(self.url + route, timeout=5).status_code, 404)
            self.assertEqual(requests.get(self.url + "/canvas", timeout=5).status_code, 404)
        self.post.assert_not_called()
