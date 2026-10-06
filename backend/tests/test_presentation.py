import unittest

from sales_trainer.presentation import present
from sales_trainer.scenarios import Catalog
from support import valid_result


class PresentationTests(unittest.TestCase):
    def test_probability_and_visual_strength_are_distinct(self):
        schema = Catalog().schema
        answers = valid_result(schema)["answers"]
        answers["effect_conversion"]["noul"] = 0
        answers["effect_interest"]["noul"] = 1
        effects = present(answers, schema)["effects"]
        self.assertEqual(effects[0]["percent"], 0)
        self.assertEqual(effects[0]["opacity"], 0.15)
        self.assertEqual(effects[1]["percent"], 100)
        self.assertEqual(effects[1]["opacity"], 1)

    def test_score_is_fractional_and_not_a_probability(self):
        schema = Catalog().schema
        dimensions = present(valid_result(schema)["answers"], schema)["dimensions"]
        self.assertEqual(dimensions[0]["score"], 2.75)
        self.assertEqual(dimensions[0]["position"], 0.6875)
        self.assertEqual(max(dimensions[0]["probabilities"], key=dimensions[0]["probabilities"].get), "3")
