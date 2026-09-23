/**
 * useNodeAI — streams an AI rewrite of one canvas node through `aiProvider`.
 *
 * Live chunks flow to `onContent` (local draft + debounced persist); the final
 * accumulated text flows to `onFinish` (immediate persist). Stopping, or a
 * mid-stream failure, keeps whatever already streamed. Only one generation
 * runs at a time — re-entrant `generate` calls are ignored while busy.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { aiProvider } from '@/features/ai';

import type { CanvasNode, NodeAIAction } from '../types';
import { buildNodePrompt } from '../utils/nodePrompt';

export type UseNodeAIOptions = {
  getSnapshot: (nodeId: string) => CanvasNode | undefined;
  onContent: (nodeId: string, text: string) => void;
  onFinish: (nodeId: string, text: string) => void;
};

export type UseNodeAIResult = {
  generating: boolean;
  generate: (action: NodeAIAction) => void;
  stop: () => void;
};

export function useNodeAI(
  projectId: string,
  nodeId: string | null,
  options: UseNodeAIOptions,
): UseNodeAIResult {
  const [generating, setGenerating] = useState(false);
  const abortRef = useRef(false);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current = true;
      busyRef.current = false;
    };
  }, []);

  const stop = useCallback(() => {
    abortRef.current = true;
  }, []);

  const generate = useCallback(
    (action: NodeAIAction) => {
      if (projectId === '' || nodeId === null || busyRef.current) return;
      const node = optionsRef.current.getSnapshot(nodeId);
      if (!node) return;

      busyRef.current = true;
      abortRef.current = false;
      setGenerating(true);

      const prompt = buildNodePrompt(action, node.title, node.content);
      const prefix = action === 'continue' && node.content !== '' ? `${node.content}\n\n` : '';
      let acc = prefix;

      void (async () => {
        try {
          const stream = aiProvider.sendMessage([{ role: 'user', content: prompt }]);
          for await (const chunk of stream) {
            if (abortRef.current || !mountedRef.current) break;
            acc += chunk;
            optionsRef.current.onContent(nodeId, acc);
          }
        } catch {
          // Keep any partial stream already delivered to the node.
        } finally {
          busyRef.current = false;
          if (mountedRef.current) {
            setGenerating(false);
            if (acc !== prefix) {
              optionsRef.current.onFinish(nodeId, acc);
            }
          }
        }
      })();
    },
    [projectId, nodeId],
  );

  return { generating, generate, stop };
}
