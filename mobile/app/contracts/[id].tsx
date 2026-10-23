import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Body, Caption, Card, Row, Screen, Subtitle, Title } from '../../components/ui';
import { api } from '../../lib/api';
import { spacing, colors } from '../../lib/theme';

// Mobile contract viewer. The signature-pad e-sign happens on the web dashboard
// (/dashboard/worker/contracts/[id]/sign) — the mobile build does not yet carry
// a React Native signature-capture control, so this screen is read-only for now.

type Contract = {
  id: string;
  jobTitle: string;
  siteAddress: string | null;
  rate: number;
  rateUnit: string;
  status: string;
  startedAt: string;
  signedAt: string | null;
  signatureHash: string | null;
  signedById: string | null;
  worker: { id: string; name: string; email: string };
  employer: { id: string; name: string; email: string };
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtSar(n: number): string {
  return `SAR ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = typeof id === 'string' ? id : '';

  const contractQuery = useQuery<{ contract: Contract }>({
    queryKey: ['contract', contractId],
    queryFn: () => api(`/api/worker/contracts/${contractId}/sign`),
    enabled: !!contractId,
  });

  if (contractQuery.isLoading) {
    return (
      <Screen>
        <Title>Loading contract…</Title>
      </Screen>
    );
  }

  if (!contractQuery.data?.contract) {
    return (
      <Screen>
        <Title>Contract not found</Title>
      </Screen>
    );
  }

  const contract = contractQuery.data.contract;
  const isSigned = !!contract.signedAt;

  return (
    <Screen>
      <Title>Contract</Title>
      <Subtitle style={{ color: colors.muted, marginBottom: spacing.md }}>
        {contract.jobTitle}
      </Subtitle>

      <Card>
        <Row align="space-between">
          <Caption>Site</Caption>
          <Caption>{contract.siteAddress ?? '—'}</Caption>
        </Row>
        <Row align="space-between">
          <Caption>Rate</Caption>
          <Body>
            {fmtSar(contract.rate)} / {contract.rateUnit.toLowerCase()}
          </Body>
        </Row>
        <Row align="space-between">
          <Caption>Employer</Caption>
          <Body>{contract.employer.name}</Body>
        </Row>
        <Row align="space-between">
          <Caption>Started</Caption>
          <Caption>{formatDate(contract.startedAt)}</Caption>
        </Row>
        <Row align="space-between">
          <Caption>Status</Caption>
          <Body>{contract.status}</Body>
        </Row>
      </Card>

      {isSigned ? (
        <Card>
          <Row align="space-between">
            <Caption>Signed</Caption>
            <Caption style={{ color: colors.success }}>
              {formatDate(contract.signedAt!)}
            </Caption>
          </Row>
          {contract.signatureHash && (
            <Row align="space-between">
              <Caption>Hash</Caption>
              <Caption>{contract.signatureHash.slice(0, 16)}…</Caption>
            </Row>
          )}
        </Card>
      ) : (
        <Card>
          <Body>Open this contract on the web dashboard to sign.</Body>
        </Card>
      )}
    </Screen>
  );
}
