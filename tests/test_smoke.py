import unittest


class SmokeTests(unittest.TestCase):
    def test_import_agente(self):
        import agente  # noqa: F401


if __name__ == "__main__":
    unittest.main()
