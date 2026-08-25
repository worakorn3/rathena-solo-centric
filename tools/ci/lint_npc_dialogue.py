#!/usr/bin/env python3
"""
rAthena NPC Dialogue Stacking & Pagination Linter
------------------------------------------------
Scans rAthena NPC script files (*.txt) for dialogue window overflow:
1. Flags consecutive `mes` statements exceeding the safe client limit (> 5 lines) without a `next;` or `close;`.
2. Flags unpaginated loops (`for`, `while`) containing `mes` without pagination (`next;` / `clear;`).

Author: Antigravity CLI
"""

import sys
import os
import re
import argparse
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional

# ANSI color escape codes (auto-disabled if output is redirected)
USE_COLOR = sys.stdout.isatty() and os.name != 'nt' or os.environ.get('TERM') or 'WT_SESSION' in os.environ

def color(text: str, code: str) -> str:
    if not USE_COLOR:
        return text
    codes = {
        'red': '\033[91m',
        'green': '\033[92m',
        'yellow': '\033[93m',
        'blue': '\033[94m',
        'cyan': '\033[96m',
        'bold': '\033[1m',
        'dim': '\033[2m',
        'reset': '\033[0m'
    }
    return f"{codes.get(code, '')}{text}{codes['reset']}"


class DialogueIssue:
    def __init__(self, file_path: str, line_num: int, issue_type: str, message: str, snippet: str = ""):
        self.file_path = file_path
        self.line_num = line_num
        self.issue_type = issue_type  # 'STACKED_DIALOGUE', 'UNPAGINATED_LOOP', 'EMOJI_IN_DIALOGUE'
        self.message = message
        self.snippet = snippet

    def to_dict(self) -> Dict[str, Any]:
        return {
            "file": self.file_path,
            "line": self.line_num,
            "type": self.issue_type,
            "message": self.message,
            "snippet": self.snippet
        }

    def __str__(self) -> str:
        tag_color = 'red' if self.issue_type in ('STACKED_DIALOGUE', 'EMOJI_IN_DIALOGUE') else 'yellow'
        return (
            f"{color(self.file_path, 'cyan')}:{color(str(self.line_num), 'yellow')}: "
            f"{color(f'[{self.issue_type}]', tag_color)} {self.message}"
            + (f"\n  {color('-->', 'blue')} {color(self.snippet.strip(), 'dim')}" if self.snippet else "")
        )


def strip_comments_with_line_map(content: str) -> List[Tuple[int, str]]:
    """
    Strips single-line and multi-line comments from script while preserving original 1-based line numbers.
    Returns a list of (line_number, stripped_line_text).
    """
    lines = content.splitlines()
    result = []
    in_block_comment = False

    for idx, raw_line in enumerate(lines, start=1):
        line = raw_line
        stripped = ""
        i = 0
        n = len(line)

        while i < n:
            if in_block_comment:
                end_idx = line.find("*/", i)
                if end_idx != -1:
                    in_block_comment = False
                    i = end_idx + 2
                else:
                    i = n
            else:
                if line[i:i+2] == "/*":
                    in_block_comment = True
                    i += 2
                elif line[i:i+2] == "//":
                    # Single-line comment; skip rest of line
                    break
                else:
                    stripped += line[i]
                    i += 1

        result.append((idx, stripped))

    return result


def count_mes_lines_in_statement(stmt_text: str) -> int:
    """
    Counts effective dialogue lines inside a `mes` statement, including embedded '\\n'.
    """
    # Find all string literals in the statement
    matches = re.findall(r'"([^"\\]*(?:\\.[^"\\]*)*)"', stmt_text)
    if not matches:
        return 1

    total_embedded_newlines = sum(match.count('\\n') for match in matches)
    return 1 + total_embedded_newlines



def lint_script_content(file_path: str, content: str, max_lines: int = 5) -> List[DialogueIssue]:
    """
    Analyzes an rAthena script for dialogue stacking and unpaginated loop outputs.
    """
    issues: List[DialogueIssue] = []
    lines_with_numbers = strip_comments_with_line_map(content)

    # Keywords that reset the active dialogue window
    BREAK_KEYWORDS_REGEX = re.compile(
        r'\b(next|clear|close|close2|select|menu|input|prompt|end)\s*[\(;]',
        re.IGNORECASE
    )
    
    # Label definition regex (e.g. OnInit:, L_Option1:, OnTimer1000:)
    LABEL_REGEX = re.compile(r'^\s*[A-Za-z0-9_#]+:\s*$')
    
    # Loop start regex
    LOOP_START_REGEX = re.compile(r'\b(for|while)\s*\(', re.IGNORECASE)

    # Unicode emoji and non-ASCII pattern (outside standard 7-bit ASCII printable range)
    EMOJI_OR_NON_ASCII_REGEX = re.compile(r'[\U00010000-\U0010ffff\u2600-\u27bf\u2300-\u23ff\u2b50-\u2b55\u0080-\uffff]')
    DIALOGUE_STMT_REGEX = re.compile(r'\b(mes|select|menu|announce|npctalk|waitingroom)\b', re.IGNORECASE)

    consecutive_mes_count = 0
    mes_start_line = 0
    in_script_body = False
    brace_depth = 0

    # For loop tracking: stack of dicts with loop tracking info
    loop_stack = []

    for line_num, line in lines_with_numbers:
        trimmed = line.strip()
        if not trimmed:
            continue

        # Check script header declaration (e.g., prontera,150,150,4<TAB>script<TAB>...)
        if '\tscript\t' in line or '\tduplicate' in line or 'function\tscript\t' in line:
            in_script_body = True
            consecutive_mes_count = 0
            mes_start_line = 0

        # Track block depth
        open_braces = trimmed.count('{')
        close_braces = trimmed.count('}')

        # Check for non-ASCII / emoji in dialogue or menu text
        if in_script_body and DIALOGUE_STMT_REGEX.search(trimmed):
            if EMOJI_OR_NON_ASCII_REGEX.search(trimmed):
                issues.append(DialogueIssue(
                    file_path=file_path,
                    line_num=line_num,
                    issue_type='EMOJI_IN_DIALOGUE',
                    message=(
                        "Non-ASCII or emoji character detected in NPC dialogue/menu statement. "
                        "Ragnarok Online client cannot render multi-byte UTF-8 emojis, causing corrupted characters in-game."
                    ),
                    snippet=trimmed
                ))

        # Check if a loop started on this line
        if LOOP_START_REGEX.search(trimmed):
            loop_stack.append({
                'line': line_num,
                'start_depth': brace_depth,
                'has_mes': False,
                'has_pagination': False
            })

        # Check for label (labels represent new entry points / subroutines)
        if LABEL_REGEX.match(trimmed):
            consecutive_mes_count = 0
            mes_start_line = 0

        # Check if line contains a reset/break command
        if BREAK_KEYWORDS_REGEX.search(trimmed):
            consecutive_mes_count = 0
            mes_start_line = 0
            # If inside a loop, mark that this loop has pagination/break
            for loop in loop_stack:
                loop['has_pagination'] = True

        # Check for `mes` statements
        mes_matches = re.finditer(r'\bmes\b\s*([^;]*);?', trimmed, re.IGNORECASE)
        for match in mes_matches:
            stmt = match.group(0)
            added_lines = count_mes_lines_in_statement(stmt)

            if consecutive_mes_count == 0:
                mes_start_line = line_num

            consecutive_mes_count += added_lines

            # Mark loop as having mes
            for loop in loop_stack:
                loop['has_mes'] = True

            # If consecutive lines exceed limit without a break command
            if consecutive_mes_count > max_lines:
                issues.append(DialogueIssue(
                    file_path=file_path,
                    line_num=line_num,
                    issue_type='STACKED_DIALOGUE',
                    message=(
                        f"Stacked dialogue detected: {consecutive_mes_count} consecutive lines rendered "
                        f"since line {mes_start_line} without 'next;' or 'close;'. (Safe limit: {max_lines} lines/page)."
                    ),
                    snippet=trimmed
                ))
                # Reset counter to avoid duplicate spam on subsequent lines of the same block
                consecutive_mes_count = 0

        # Update brace depth
        brace_depth += (open_braces - close_braces)
        if brace_depth < 0:
            brace_depth = 0

        # Close loops that have exited
        while loop_stack and brace_depth <= loop_stack[-1]['start_depth'] and close_braces > 0:
            finished_loop = loop_stack.pop()
            if finished_loop['has_mes'] and not finished_loop['has_pagination']:
                issues.append(DialogueIssue(
                    file_path=file_path,
                    line_num=finished_loop['line'],
                    issue_type='UNPAGINATED_LOOP',
                    message=(
                        "Dynamic loop contains 'mes' dialogue calls without pagination ('next;' or 'clear;'). "
                        "Dialogue will stack and overflow client window."
                    ),
                    snippet=f"Loop starting at line {finished_loop['line']}"
                ))

        if brace_depth == 0 and close_braces > 0:
            # Exited top-level script block
            in_script_body = False
            consecutive_mes_count = 0
            mes_start_line = 0

    return issues


def scan_path(target_path: Path, max_lines: int = 5) -> Tuple[int, List[DialogueIssue]]:
    """
    Scans a file or recursively scans a directory for rAthena script files (.txt).
    """
    all_issues: List[DialogueIssue] = []
    file_count = 0

    if target_path.is_file():
        files_to_scan = [target_path]
    elif target_path.is_dir():
        files_to_scan = sorted(list(target_path.glob('**/*.txt')))
    else:
        return 0, []

    for file_p in files_to_scan:
        file_count += 1
        try:
            with open(file_p, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
            # Fast check if file is likely an NPC script
            if 'script\t' not in content and 'mes ' not in content and 'mes\t' not in content:
                continue
            
            issues = lint_script_content(str(file_p), content, max_lines=max_lines)
            all_issues.extend(issues)
        except Exception as e:
            print(f"{color('[WARN]', 'yellow')} Could not read {file_p}: {e}", file=sys.stderr)

    return file_count, all_issues


def main():
    parser = argparse.ArgumentParser(
        description="rAthena NPC Dialogue Stacking & 'next;' Pagination Linter"
    )
    parser.add_argument(
        '--path',
        nargs='*',
        default=['npc/custom', 'npc/test'],
        help="Paths or files to check (default: npc/custom npc/test)"
    )
    parser.add_argument(
        '--max-lines',
        type=int,
        default=5,
        help="Maximum consecutive dialogue lines per page before requiring 'next;' (default: 5)"
    )
    parser.add_argument(
        '--warn-only',
        action='store_true',
        help="Always return exit code 0 regardless of issues found"
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help="Output issues in JSON format"
    )
    parser.add_argument(
        '--test',
        action='store_true',
        help="Run the deterministic Python unit test suite for this linter"
    )

    args = parser.parse_args()

    if args.test:
        import subprocess
        test_file = Path(__file__).parent / 'test_lint_npc_dialogue.py'
        sys.exit(subprocess.call([sys.executable, str(test_file)]))

    total_files = 0
    total_issues: List[DialogueIssue] = []

    for p in args.path:
        path_obj = Path(p)
        if not path_obj.exists():
            continue
        files_scanned, issues = scan_path(path_obj, max_lines=args.max_lines)
        total_files += files_scanned
        total_issues.extend(issues)

    if args.json:
        import json
        output_data = {
            "files_scanned": total_files,
            "issue_count": len(total_issues),
            "max_lines_threshold": args.max_lines,
            "issues": [issue.to_dict() for issue in total_issues]
        }
        print(json.dumps(output_data, indent=2))
    else:
        print(color("=== rAthena NPC Dialogue Stacking Linter ===", "bold"))
        print(f"Scanned {color(str(total_files), 'cyan')} files with max page limit: {color(str(args.max_lines), 'yellow')} lines.")
        print("-" * 50)

        if not total_issues:
            print(color("[PASS] All NPC scripts passed! No dialogue stacking or unpaginated loops found.", "green"))
            print("-" * 50)
            sys.exit(0)

        print(f"{color('FAIL:', 'red')} Found {color(str(len(total_issues)), 'red')} dialogue overflow issue(s):\n")
        for issue in total_issues:
            print(str(issue))
            print()

        print("-" * 50)
        print(color("Tip: Insert 'next;' or 'clear;' to paginate dialogue (max 4-5 lines per box).", "cyan"))

    if args.warn_only:
        sys.exit(0)
    else:
        sys.exit(1 if total_issues else 0)


if __name__ == '__main__':
    main()
