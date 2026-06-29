import unittest
import tempfile
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))


class TestNormalizeUnits(unittest.TestCase):
    def setUp(self):
        from fichas import rewriter_descripciones as rd
        self.rd = rd

    def test_mts2_to_m2(self):
        result = self.rd.normalize_units("30 mts2 totales")
        self.assertEqual(result, "30 m² totales")

    def test_sup2_to_squared(self):
        result = self.rd.normalize_units("50 mts2 sup2")
        self.assertEqual(result, "50 m² ²")

    def test_uss_to_usd(self):
        result = self.rd.normalize_units("U$S 100.000")
        self.assertEqual(result, "USD 100.000")

    def test_combined_replacements(self):
        result = self.rd.normalize_units("Depto de 30 mts2, U$S 50000")
        self.assertEqual(result, "Depto de 30 m², USD 50000")

    def test_no_changes(self):
        result = self.rd.normalize_units("Hermoso departamento en Recoleta")
        self.assertEqual(result, "Hermoso departamento en Recoleta")

    def test_empty_string(self):
        self.assertEqual(self.rd.normalize_units(""), "")
        self.assertEqual(self.rd.normalize_units(None), "")


class TestParseDescripcionFile(unittest.TestCase):
    def setUp(self):
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from fichas import rewriter_descripciones as rd
        self.rd = rd
        self.tmp = tempfile.mkdtemp()

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _write(self, content):
        f = Path(self.tmp) / "descripcion.txt"
        f.write_text(content, encoding="utf-8")
        return f

    def test_parses_auto_generated_format(self):
        content = (
            "AUTO_GENERATED\n"
            "Austria 2200 (Recoleta)\n"
            "DEPARTAMENTO DE 1 AMBIENTES- FRENTE- 30 mts2 TOTALES -\n\n"
            "Alquiler: $ 480.000\n"
            "Expensas: $ 190.000\n"
            "Ambientes: 1\n\n"
            "Características:\n"
            "Hermoso monoambiente en Recoleta.\n"
            "Aire acondicionado incluido.\n"
        )
        f = self._write(content)
        result = self.rd.parse_descripcion_file(f)
        self.assertIsNotNone(result)
        self.assertIn("caracteristicas", result)
        self.assertIn("Hermoso monoambiente", result["caracteristicas"])
        self.assertIn("Alquiler: $ 480.000", result["header_lines"])

    def test_parses_rewritten_format(self):
        content = (
            "austria 2200 (recoleta)\n"
            "departamento de 1 ambientes - frente - 30 m² totales -\n\n"
            "alquiler: $ 480.000\n"
            "expensas: $ 190.000\n"
            "ambientes: 1\n\n"
            "características:\n"
            "hermoso monoambiente en recoleta.\n"
        )
        f = self._write(content)
        result = self.rd.parse_descripcion_file(f)
        self.assertIsNotNone(result)
        self.assertIn("caracteristicas", result)
        self.assertEqual(result["caracteristicas"], "hermoso monoambiente en recoleta.")

    def test_no_caracteristicas_section(self):
        content = "Solo un texto sin estructura\n"
        f = self._write(content)
        result = self.rd.parse_descripcion_file(f)
        self.assertIsNotNone(result)
        self.assertEqual(result["caracteristicas"], content.strip())

    def test_empty_file(self):
        f = self._write("")
        result = self.rd.parse_descripcion_file(f)
        self.assertIsNotNone(result)
        self.assertEqual(result["caracteristicas"], "")

    def test_file_not_found(self):
        result = self.rd.parse_descripcion_file(Path(self.tmp) / "no_existe.txt")
        self.assertIsNone(result)


class TestReconstructDescripcionFile(unittest.TestCase):
    def setUp(self):
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from fichas import rewriter_descripciones as rd
        self.rd = rd

    def test_reconstruct_preserves_header(self):
        parsed = {
            "header_lines": [
                "austria 2200 (recoleta)",
                "departamento de 1 ambientes - frente - 30 m² totales -",
                "",
                "alquiler: $ 480.000",
                "expensas: $ 190.000",
                "ambientes: 1",
                "",
            ],
            "caracteristicas": "Texto viejo.",
        }
        rewritten = "Texto nuevo y mejorado.\nCon dos párrafos."
        result = self.rd.reconstruct_descripcion_file(parsed, rewritten)
        self.assertIn("austria 2200 (recoleta)", result)
        self.assertIn("alquiler: $ 480.000", result)
        self.assertIn("Texto nuevo y mejorado.", result)
        self.assertNotIn("Texto viejo.", result)

    def test_reconstruct_formats_caracteristicas(self):
        parsed = {
            "header_lines": ["direccion test", "linea2"],
            "caracteristicas": "viejo",
        }
        rewritten = "nuevo texto"
        result = self.rd.reconstruct_descripcion_file(parsed, rewritten)
        self.assertIn("características:", result.lower())
        self.assertIn("nuevo texto", result)

    def test_reconstruct_removes_auto_generated(self):
        parsed = {
            "header_lines": [
                "AUTO_GENERATED",
                "Austria 2200 (Recoleta)",
                "",
                "Alquiler: $ 480.000",
            ],
            "caracteristicas": "vieja descripcion",
        }
        rewritten = "nueva descripcion profesional"
        result = self.rd.reconstruct_descripcion_file(parsed, rewritten)
        self.assertNotIn("AUTO_GENERATED", result)
        self.assertIn("Austria 2200 (Recoleta)", result)
        self.assertIn("nueva descripcion profesional", result)


class TestInferMissingFields(unittest.TestCase):
    def setUp(self):
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from fichas import rewriter_descripciones as rd
        self.rd = rd

    def test_parse_llm_inference_response(self):
        response = (
            "ambientes: 3\n"
            "dormitorios: 2\n"
            "banos: 1\n"
            "antiguedad: 10 años\n"
        )
        result = self.rd._parse_inference_response(response)
        self.assertEqual(result.get("ambientes"), "3")
        self.assertEqual(result.get("dormitorios"), "2")
        self.assertEqual(result.get("banos"), "1")
        self.assertEqual(result.get("antiguedad"), "10 años")

    def test_parse_inference_with_empty(self):
        response = "No se pueden inferir datos adicionales."
        result = self.rd._parse_inference_response(response)
        self.assertEqual(result, {})

    def test_parse_inference_filters_no_data_value(self):
        response = "piso: NO_DATA\nmascotas: NO_DATA"
        result = self.rd._parse_inference_response(response)
        self.assertEqual(result, {})

    def test_parse_inference_mixed(self):
        response = (
            "Datos inferidos:\n"
            "  orientacion: Norte\n"
            "  mascotas: Si\n"
        )
        result = self.rd._parse_inference_response(response)
        self.assertEqual(result.get("orientacion"), "Norte")
        self.assertEqual(result.get("mascotas"), "Si")


sys.path.insert(0, str(Path(__file__).parent.parent))

if __name__ == "__main__":
    import sys
    unittest.main()
