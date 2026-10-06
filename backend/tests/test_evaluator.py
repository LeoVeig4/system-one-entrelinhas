import copy
import unittest
from unittest.mock import Mock

import requests

from sales_trainer import AppError
from sales_trainer.evaluator import Evaluator, validate_result
from sales_trainer.scenarios import Catalog
from support import input_data, valid_result


class EvaluatorTests(unittest.TestCase):
    def setUp(self):
        self.catalog = Catalog()
        self.result = valid_result(self.catalog.schema)

    def test_exactly_one_call_with_all_types_and_immutable_text(self):
        response = Mock()
        response.json.return_value = self.result
        post = Mock(return_value=response)
        data = input_data(self.catalog, "  Uma resposta com espaços.  ")
        result = Evaluator(self.catalog, post=post).evaluate(data)
        post.assert_called_once()
        payload = post.call_args.kwargs["json"]
        self.assertEqual(len(payload["questions"]), 10)
        self.assertEqual(result["seller_response"], data["seller_response"])
        self.assertEqual(result["attempt_id"], data["attempt_id"])
        self.assertEqual(len(result["presentation"]["effects"]), 6)

    def test_invalid_inputs_never_call_model(self):
        post = Mock()
        evaluator = Evaluator(self.catalog, post=post)
        for text in ["", " \n ", "a" * 2001, True, None]:
            with self.subTest(text=str(text)[:15]), self.assertRaises(AppError):
                evaluator.evaluate(input_data(self.catalog, text))
        post.assert_not_called()

    def test_unicode_character_limit(self):
        evaluator = Evaluator(self.catalog)
        evaluator.prepare(input_data(self.catalog, "🙂" * 2000))
        with self.assertRaises(AppError):
            evaluator.prepare(input_data(self.catalog, "🙂" * 2001))

    def test_malformed_model_outputs(self):
        mutations = [
            lambda r: r["answers"].pop("pressure"),
            lambda r: r["answers"]["effect_interest"].update(noul=True),
            lambda r: r["answers"]["effect_interest"].update(noul=float("nan")),
            lambda r: r["answers"]["effect_interest"].update(noul=float("inf")),
            lambda r: r["answers"]["effect_interest"].update(noul="0.8"),
            lambda r: r["answers"]["effect_interest"].update(noul=10 ** 500),
            lambda r: r["answers"]["pressure"].update(type="choice"),
            lambda r: r["answers"]["pressure"].update(score=3),
            lambda r: r["answers"]["pressure"]["legend"].update({"0": "wrong"}),
            lambda r: r["answers"]["pressure"]["probabilities"].update({"4": 0.2}),
            lambda r: r["answers"]["seller_approach"].update(choice="value"),
            lambda r: r["answers"]["seller_approach"]["probabilities"].pop("value"),
            lambda r: r.update(model="another-model"),
        ]
        for index, mutate in enumerate(mutations):
            candidate = copy.deepcopy(self.result)
            mutate(candidate)
            with self.subTest(index=index), self.assertRaises(AppError) as caught:
                validate_result(candidate, self.catalog.schema)
            self.assertEqual(caught.exception.status, 502)

    def test_noul_values_do_not_need_to_sum_to_one(self):
        answers = validate_result(self.result, self.catalog.schema)
        self.assertAlmostEqual(sum(answer["noul"] for answer in answers.values() if answer["type"] == "noul"), 4.8)

    def test_transport_errors_are_not_scores(self):
        for error, status in [(requests.Timeout(), 504), (requests.ConnectionError(), 503)]:
            with self.subTest(status=status), self.assertRaises(AppError) as caught:
                Evaluator(self.catalog, post=Mock(side_effect=error)).evaluate(input_data(self.catalog))
            self.assertEqual(caught.exception.status, status)
