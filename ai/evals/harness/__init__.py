"""ConstructsHub AI evaluation harness.

Package root. Keep imports stdlib-only — the harness must run on a bare Python
installation (CI, local dev, pen-test rig) with no `pip install`. If a dataset
grows large enough to need a tensor library, it belongs behind an optional
feature flag with a graceful "skipped: numpy not installed" path, not an
unconditional import.
"""

__all__ = ["metrics", "datasets", "runner"]
__version__ = "0.1.0"
