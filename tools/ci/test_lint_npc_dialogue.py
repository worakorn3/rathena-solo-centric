#!/usr/bin/env python3
"""
Unit tests for rAthena NPC Dialogue Stacking & Pagination Linter
----------------------------------------------------------------
Deterministic test suite verifying comment stripping, line counting,
stacked dialogue detection, and loop pagination analysis.

Usage:
    python tools/ci/test_lint_npc_dialogue.py
    python -m unittest tools/ci/test_lint_npc_dialogue.py
"""

import unittest
import sys
from pathlib import Path

# Add script directory to sys.path to allow direct import
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from lint_npc_dialogue import (
    strip_comments_with_line_map,
    count_mes_lines_in_statement,
    lint_script_content
)


class TestDialogueLinter(unittest.TestCase):

    def test_strip_comments(self):
        content = (
            "// Single line comment\n"
            "mes \"Hello\"; // Trailing comment\n"
            "/* Block\n"
            "   comment */ mes \"World\";\n"
        )
        lines = strip_comments_with_line_map(content)
        self.assertEqual(len(lines), 4)
        self.assertEqual(lines[0][1].strip(), "")
        self.assertIn('mes "Hello";', lines[1][1])
        self.assertNotIn('Trailing comment', lines[1][1])
        self.assertIn('mes "World";', lines[3][1])
        self.assertNotIn('Block', lines[2][1])

    def test_count_mes_lines(self):
        self.assertEqual(count_mes_lines_in_statement('mes "Single line";'), 1)
        self.assertEqual(count_mes_lines_in_statement('mes "Line 1\\nLine 2";'), 2)
        self.assertEqual(count_mes_lines_in_statement('mes "1\\n2\\n3\\n4\\n5";'), 5)

    def test_compliant_short_dialogue(self):
        script = """
prontera,150,150,4\tscript\tTestNpc\t100,{
    mes "[NPC]";
    mes "Line 1";
    mes "Line 2";
    mes "Line 3";
    close;
}
"""
        issues = lint_script_content("test.txt", script, max_lines=5)
        self.assertEqual(len(issues), 0, "Compliant dialogue (<5 lines) should have zero issues")

    def test_compliant_paginated_dialogue(self):
        script = """
prontera,150,150,4\tscript\tTestNpc\t100,{
    mes "[NPC]";
    mes "Page 1 - Line 1";
    mes "Page 1 - Line 2";
    mes "Page 1 - Line 3";
    next;
    mes "[NPC]";
    mes "Page 2 - Line 1";
    mes "Page 2 - Line 2";
    mes "Page 2 - Line 3";
    close;
}
"""
        issues = lint_script_content("test.txt", script, max_lines=5)
        self.assertEqual(len(issues), 0, "Paginated dialogue with next; should have zero issues")

    def test_stacked_dialogue_detected(self):
        script = """
prontera,150,150,4\tscript\tTestNpc\t100,{
    mes "[NPC]";
    mes "Line 1";
    mes "Line 2";
    mes "Line 3";
    mes "Line 4";
    mes "Line 5";
    mes "Line 6";
    close;
}
"""
        issues = lint_script_content("test.txt", script, max_lines=5)
        self.assertEqual(len(issues), 1, "7 consecutive mes lines must trigger STACKED_DIALOGUE")
        self.assertEqual(issues[0].issue_type, 'STACKED_DIALOGUE')

    def test_stacked_dialogue_embedded_newlines(self):
        script = """
prontera,150,150,4\tscript\tTestNpc\t100,{
    mes "[NPC]";
    mes "Line 1\\nLine 2\\nLine 3\\nLine 4\\nLine 5";
    close;
}
"""
        issues = lint_script_content("test.txt", script, max_lines=5)
        self.assertEqual(len(issues), 1, "mes with 5 embedded newlines (6 lines total) must trigger STACKED_DIALOGUE")
        self.assertEqual(issues[0].issue_type, 'STACKED_DIALOGUE')

    def test_compliant_paginated_loop(self):
        script = """
prontera,150,150,4\tscript\tTestNpc\t100,{
    for (.@i = 0; .@i < 10; .@i++) {
        mes "Item " + .@i;
        next;
    }
    close;
}
"""
        issues = lint_script_content("test.txt", script, max_lines=5)
        self.assertEqual(len(issues), 0, "Loop containing next; should have zero issues")

    def test_unpaginated_loop_detected(self):
        script = """
prontera,150,150,4\tscript\tTestNpc\t100,{
    for (.@i = 0; .@i < 10; .@i++) {
        mes "Item " + .@i;
    }
    close;
}
"""
        issues = lint_script_content("test.txt", script, max_lines=5)
        loop_issues = [i for i in issues if i.issue_type == 'UNPAGINATED_LOOP']
        self.assertEqual(len(loop_issues), 1, "Unpaginated loop must trigger UNPAGINATED_LOOP")


if __name__ == '__main__':
    unittest.main(verbosity=2)
