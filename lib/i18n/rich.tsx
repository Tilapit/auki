import { Fragment, type ReactNode } from 'react';

/**
 * Fills "{slot}" markers in a string with elements, so a sentence can stay
 * whole in the dictionary while a name or a time inside it is real markup.
 */
export function rich(template: string, slots: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{\w+\})/g).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return <Fragment key={index}>{key && key in slots ? slots[key] : part}</Fragment>;
  });
}
