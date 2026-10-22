import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Body, Button, Card, Caption, Row, Screen, Title } from '../../components/ui';
import { useToast } from '../../components/toast';
import { api, ApiError } from '../../lib/api';
import { enqueue } from '../../lib/outbox';
import { fmtSar } from '../../lib/money';
import { spacing, colors } from '../../lib/theme';
import { t } from '../../lib/i18n';

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

type SignResponse = {
  success: boolean;
  contractId: string;
  signedAt: string;
  signatureHash: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtSar(n: number): string {
  return `SAR ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function ContractSignScreen({ route }: { route: { params: { id: string } } }) {
  const { id: contractId } = route.params;
  const toast = useToast();
  const qc = useQueryClient();
  const [signature, setSignature] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const contractQuery = useQuery<{ contract: Contract }>({
    queryKey: ['contract', 'sign', contractId],
    queryFn: () => api(`/api/worker/contracts/${contractId}/sign`),
    enabled: !!contractId,
  });

  const signMutation = useMutation({
    mutationFn: (data: { signatureImage: string }) =>
      api(`/api/worker/contracts/${contractId}/sign`, {
        method: 'POST',
        body: JSON.stringify({ signatureImage: data.signatureImage }),
      }),
    onSuccess: (res: SignResponse) => {
      setSubmitting(false);
      setSignature(null);
      toast.show('Contract signed successfully', { tone: 'success' });
      void qc.invalidateQueries({ queryKey: ['contract', 'sign', contractId] });
    },
    onError: async (err) => {
      setSubmitting(false);
      if (err instanceof ApiError && err.status === 0) {
        await enqueue({
          kind: 'contract.sign',
          method: 'POST',
          path: `/api/worker/contracts/${contractId}/sign`,
          body: { signatureImage: signature },
        });
        toast.show('Offline — signature queued', { tone: 'warning' });
      } else {
        toast.show(err instanceof Error ? err.message : 'Signing failed', { tone: 'danger' });
      }
    },
  });

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignature(null);
  }, []);

  const saveCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setSignature(dataUrl);
      setDrawing(false);
    }
  }, []);

  const handleMouseDown = useCallback((e: { nativeEvent: { locationX: number; locationY: number } }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.locationX, e.nativeEvent.locationY);
    setDrawing(true);
  }, []);

  const handleMouseMove = useCallback((e: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.locationX, e.nativeEvent.locationY);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [drawing]);

  const handleMouseUp = useCallback(() => {
    setDrawing(false);
  }, [drawing]);

  const handleSubmit = async () => {
    if (!signature) {
      Alert.alert('Error', 'Please provide your signature');
      return;
    }
    setSubmitting(true);
    try {
      await signMutation.mutateAsync({ signatureImage: signature });
    } catch {
      // Error handled by mutation
    }
  }, [signature, contractId, signMutation]);

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
    <Screen style={{ flex: 1 }}>
      <Title style={{ marginBottom: spacing.md }}>Sign Contract</Title>
      <Subtitle style={{ marginBottom: spacing.md, color: colors.muted }}>
        {contract.jobTitle}
      </Subtitle>

      <Card style={{ marginBottom: spacing.md }}>
        <Row align="space-between" style={{ marginBottom: spacing.xs }}>
          <Caption>Job Title</Caption>
          <Body>{contract.jobTitle}</Body>
        </Row>
        <Row align="space-between" style={{ marginBottom: spacing.xs }}>
          <Caption>Site</Caption>
          <Caption>{contract.siteAddress ?? '—'}</Caption>
        </Row>
        <Row align="space-between" style={{ marginBottom: spacing.xs }}>
          <Caption>Rate</Caption>
          <Body>{fmtSar(contract.rate)} / {contract.rateUnit.toLowerCase()}</Body>
        </Row>
        <Row align="space-between" style={{ marginBottom: spacing.xs }}>
          <Caption>Employer</Caption>
          <Body>{contract.employer.name}</Body>
        </Row>
        <Row align="space-between" style={{ marginBottom: spacing.xs }}>
          <Caption>Started</Caption>
          <Caption>{formatDate(contract.startedAt)}</Caption>
        </Row>
        <Row align="space-between">
          <Caption>Status</Caption>
          <Body>{contract.status}</Body>
        </Row>
      </Card>

      {!isSigned && (
        <>
          <Card style={{ marginBottom: spacing.md }}>
            <Title style={{ marginBottom: spacing.sm }}>Contract Terms</Title>
            <Body style={{ fontSize: 14, lineHeight: 22 }}>
              This contract is between the Employer and the Worker for the position of <strong>{contract.jobTitle}</strong> at <strong>{contract.siteAddress ?? 'the designated site'}</strong>.
            </Body>
            <View style={{ height: spacing.sm }} />
            <Body style={{ fontSize: 14, lineHeight: 22 }}>
              Rate: <strong>{fmtSar(contract.rate)} per {contract.rateUnit.toLowerCase()}</strong>
            </Body>
            <Body style={{ fontSize: 14, lineHeight: 22, marginTop: spacing.xs }}>
              Work Location: <strong>{contract.siteAddress ?? 'As assigned'}</strong>
            </Body>
            <Body style={{ fontSize: 14, lineHeight: 22, marginTop: spacing.xs }}>
              Start Date: <strong>{new Date(contract.startedAt).toLocaleDateString('en-GB')}</strong>
            </Body>
            <Body style={{ fontSize: 14, lineHeight: 22, marginTop: spacing.xs }}>
              Employment Type: <strong>Contract-based</strong>
            </Body>
            <View style={{ height: spacing.md }} />
            <Body style={{ fontSize: 13, color: colors.muted }}>
              By signing below, you acknowledge that you have read, understood, and agree to the terms of this contract.
              Your signature will be captured electronically with a timestamp and cryptographic hash for verification.
            </Body>
          </Card>

          <Card style={{ marginTop: spacing.md }}>
            <Title style={{ marginBottom: spacing.sm }}>Your Signature</Title>
            <Body style={{ fontSize: 13, color: colors.muted, marginBottom: spacing.sm }}>
              Draw your signature below, then tap "Sign Contract" to electronically sign this agreement.
            </Body>

            <View style={styles.canvasContainer}>
              <canvas
                ref={canvasRef}
                width={350}
                height={180}
                style={styles.canvas}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
              <View style={styles.canvasControls}>
                <TouchableOpacity
                  onPress={clearCanvas}
                  disabled={!signature}
                  style={[styles.canvasButton, styles.canvasButtonSecondary, !signature && styles.canvasButtonDisabled]}
                >
                  <Text style={styles.canvasButtonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveCanvas}
                  disabled={drawing || !drawing && !signature}
                  style={[styles.canvasButton, drawing || !drawing && !signature ? styles.canvasButtonDisabled : {}]}
                >
                  <Text style={styles.canvasButtonText}>
                    {drawing ? 'Done' : signature ? 'Update' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {signature && (
              <View style={styles.signatureReady}>
                <Text style={styles.signatureReadyText}>Signature captured. Ready to sign.</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!signature || submitting}
              style={[styles.signButton, submitting && styles.signButtonDisabled]}
            >
              <Text style={styles.signButtonText}>
                {submitting ? '⏳ Signing...' : '✍️ Sign Contract'}
              </Text>
            </TouchableOpacity>
          </Card>
        </>
      )}

      {isSigned && (
        <Card style={{ marginTop: spacing.md }}>
          <Row align="center" gap={spacing.sm}>
            <Text style={{ fontSize: 20 }}>✅</Text>
            <View>
              <Title>Contract Signed</Title>
              <Caption style={{ color: colors.success }}>
                Signed on {formatDate(contract.signedAt!)}
                {contract.signatureHash && (
                  <>
                    {' • Hash: '}
                    <Text style={{ fontFamily: 'monospace' }}>{contract.signatureHash.slice(0, 16)}...</Text>
                  </>
                )}
              </Caption>
            </View>
          </Row>
        </Card>
      )}
    </Screen>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtSar(n: number): string {
  return `SAR ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}