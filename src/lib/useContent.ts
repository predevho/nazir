import { useEffect, useState } from 'react';
import { getContent } from './content';
import type { AllContent } from '../content/types';

type State =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'ready'; data: AllContent };

export function useContent(): State {
  const [state, setState] = useState<State>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    getContent()
      .then((data) => alive && setState({ status: 'ready', data }))
      .catch((error) => alive && setState({ status: 'error', error }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
