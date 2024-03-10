import { useEffect, useState } from 'react';

type Props = React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  onValue: (value: number | null) => void;
};

function format(value: string) {
  if (!value?.length) return null;
  const formatted = value?.replace(/[^-0-9.]/g, '').replace(/^\./, '0.').match(/(-?\d*\.?\d*)/)?.[1];
  if (!formatted?.length) return null;
  return formatted;
}

export default function InputDecimal(props: Props) {
  const { onChange, value, ...rest } = props;

  const [localValue, setLocalValue] = useState<string>(value ? value.toString() : '');

  function valueToLocal(value: any) {
    const asString = value?.toString();
    if (!asString?.length) return setLocalValue('');
    const formatted = format(asString);
    setLocalValue(formatted || '');
  }

  useEffect(() => {
    valueToLocal(value);
  }, [value]);

  const onChangeLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = format(raw);
    setLocalValue(formatted || '');
    if (!raw?.length) return props.onValue(null);

    if (formatted?.length) {
      const parsed = parseFloat(formatted);
      const final = isNaN(parsed) ? null : parsed;
      if (final !== value) props.onValue(final);
    } 
  };

  const onBlurLocal = (e: React.FocusEvent<HTMLInputElement>) => {
    valueToLocal(value);
    props.onBlur?.(e);
  };

  return <input
    { ...props }
    type='string'
    value={localValue}
    onChange={onChangeLocal}
    onBlur={onBlurLocal}
  />;
}
