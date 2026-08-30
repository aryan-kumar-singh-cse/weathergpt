"""
Test Runner Script
Quick commands for running different test suites
"""

import subprocess
import sys


def run_tests(args=None):
    """Run pytest with specified arguments."""
    cmd = ["pytest"]

    if args:
        cmd.extend(args)
    else:
        # Default: run all tests
        cmd.extend(["backend/tests/", "-v"])

    result = subprocess.run(cmd)
    sys.exit(result.returncode)


def run_fast_tests():
    """Run only fast unit tests (skip integration tests)."""
    run_tests(["backend/tests/", "-v", "-m", "not integration", "--no-cov"])


def run_integration_tests():
    """Run only integration tests."""
    run_tests(["backend/tests/", "-v", "-m", "integration"])


def run_with_coverage():
    """Run all tests with coverage report."""
    run_tests([
        "backend/tests/",
        "-v",
        "--cov=backend",
        "--cov-report=html",
        "--cov-report=term-missing"
    ])


def run_specific_file(filename):
    """Run tests from a specific file."""
    run_tests([f"backend/tests/{filename}", "-v"])


if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "fast":
            run_fast_tests()
        elif command == "integration":
            run_integration_tests()
        elif command == "coverage":
            run_with_coverage()
        elif command.startswith("test_"):
            run_specific_file(command)
        else:
            print("Usage:")
            print("  python run_tests.py              # Run all tests")
            print("  python run_tests.py fast         # Run fast unit tests only")
            print("  python run_tests.py integration  # Run integration tests only")
            print("  python run_tests.py coverage     # Run with coverage report")
            print("  python run_tests.py test_api.py  # Run specific test file")
    else:
        run_tests()
