import json
from pathlib import Path
import unittest

from sales_trainer import AppError
from sales_trainer.scenarios import Catalog


class ScenarioTests(unittest.TestCase):
    def test_example_uses_canonical_definitions(self):
        catalog = Catalog()
        example = json.loads((Path(__file__).resolve().parents[2] / "examples/system-one-request.json").read_text(encoding="utf-8"))
        self.assertEqual(example["questions"], catalog.schema["questions"])
        self.assertEqual(example["state"]["scenario"], catalog.scenarios[0])
        self.assertEqual(len(catalog.scenarios), 3)

    def test_unknown_and_outdated_scenarios(self):
        catalog = Catalog()
        for identity, version, status in [("missing", "1", 404), ("crm-planilha", "old", 409)]:
            with self.subTest(identity=identity), self.assertRaises(AppError) as caught:
                catalog.resolve(identity, version, catalog.schema["version"])
            self.assertEqual(caught.exception.status, status)
        with self.assertRaises(AppError):
            catalog.resolve("crm-planilha", "1", "old")

    def test_invalid_catalog_is_rejected(self):
        catalog = Catalog()
        catalog.schema["questions"]["pressure"]["criteria"].pop()
        with self.assertRaises(ValueError):
            catalog.validate()

    def test_dm_histories_alternate_and_finish_with_objection(self):
        catalog = Catalog()
        for scenario in catalog.scenarios:
            self.assertEqual(scenario["version"], "2")
            self.assertEqual([message["role"] for message in scenario["messages"]],
                             ["customer", "seller", "customer", "seller", "customer"])
            self.assertTrue(scenario["customer_name"])
        catalog.scenarios[0]["messages"][-1]["role"] = "seller"
        with self.assertRaises(ValueError):
            catalog.validate()
