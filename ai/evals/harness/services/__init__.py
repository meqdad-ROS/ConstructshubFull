"""Service adapters.

Each adapter has one job: hand it a sample, get back the structure the metrics
module can score. If the underlying service is unreachable, the adapter raises
`ServiceUnavailable`; the runner surfaces that as an honest "skipped: no
service" in the report rather than relabelling the sample as a miss.
"""


class ServiceUnavailable(RuntimeError):
    """The service required by this adapter is not reachable."""


class ServiceContractError(RuntimeError):
    """The service answered, but with a shape we don't understand."""
