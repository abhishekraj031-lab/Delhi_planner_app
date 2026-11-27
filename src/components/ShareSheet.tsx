import React, { useState } from 'react';
import { View } from 'react-native';
import { colors } from '../theme';
import { tr } from '../i18n';
import { withLink } from '../lib/wall';
import { APP_URL } from '../config';
import { Button, Txt } from './ui';
import { Sheet } from './Sheet';

/** Share panel for browsers that cannot open the phone's share sheet: send on WhatsApp, or copy the message. */
export function ShareSheet({ text, onClose }: { text: string | null; onClose: () => void }) {
  const [copied, setCopied] = useState<'no' | 'yes' | 'link' | 'manual'>('no');
  const msg = text ? withLink(text) : '';
  const copyText = async (t: string, ok: 'yes' | 'link') => {
    try { await (globalThis as any).navigator.clipboard.writeText(t); setCopied(ok); } catch { setCopied('manual'); }
  };
  const copy = () => copyText(msg, 'yes');
  return (
    <Sheet visible={text !== null} onClose={() => { setCopied('no'); onClose(); }} label={tr('Share')}>
      <Txt w="bold" style={{ fontSize: 20 }}>{tr('Share')}</Txt>
      <View style={{ backgroundColor: colors.fill, borderRadius: 12, padding: 14 }}>
        <Txt selectable style={{ fontSize: 15, color: colors.text }}>{msg}</Txt>
      </View>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row' }}><Button label={tr('Share on WhatsApp')} url={`https://wa.me/?text=${encodeURIComponent(msg)}`} onPress={() => {}} /></View>
        <View style={{ flexDirection: 'row' }}><Button outline label={copied === 'yes' ? tr('Copied') : tr('Copy message')} onPress={copy} /></View>
        {APP_URL ? <View style={{ flexDirection: 'row' }}><Button outline label={copied === 'link' ? tr('Copied') : tr('Copy link')} onPress={() => copyText(APP_URL, 'link')} /></View> : null}
        {copied === 'manual' ? <Txt style={{ fontSize: 13, color: colors.sub }}>{tr('Your browser did not allow copying. Press and hold the message above to copy it.')}</Txt> : null}
      </View>
    </Sheet>
  );
}
