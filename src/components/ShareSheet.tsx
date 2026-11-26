import React, { useState } from 'react';
import { View } from 'react-native';
import { colors } from '../theme';
import { withLink } from '../lib/wall';
import { Button, Txt } from './ui';
import { Sheet } from './Sheet';

/** Share panel for browsers that cannot open the phone's share sheet: send on WhatsApp, or copy the message. */
export function ShareSheet({ text, onClose }: { text: string | null; onClose: () => void }) {
  const [copied, setCopied] = useState<'no' | 'yes' | 'manual'>('no');
  const msg = text ? withLink(text) : '';
  const copy = async () => {
    try { await (globalThis as any).navigator.clipboard.writeText(msg); setCopied('yes'); } catch { setCopied('manual'); }
  };
  return (
    <Sheet visible={text !== null} onClose={() => { setCopied('no'); onClose(); }} label="Share">
      <Txt w="bold" style={{ fontSize: 20 }}>Share</Txt>
      <View style={{ backgroundColor: colors.fill, borderRadius: 12, padding: 14 }}>
        <Txt selectable style={{ fontSize: 15, color: colors.text }}>{msg}</Txt>
      </View>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row' }}><Button label="Share on WhatsApp" url={`https://wa.me/?text=${encodeURIComponent(msg)}`} onPress={() => {}} /></View>
        <View style={{ flexDirection: 'row' }}><Button outline label={copied === 'yes' ? 'Copied' : 'Copy message'} onPress={copy} /></View>
        {copied === 'manual' ? <Txt style={{ fontSize: 13, color: colors.sub }}>Your browser did not allow copying. Press and hold the message above to copy it.</Txt> : null}
      </View>
    </Sheet>
  );
}
