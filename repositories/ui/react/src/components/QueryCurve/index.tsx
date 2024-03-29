import { useEffect, useRef, useState, CSSProperties, useMemo, useCallback } from 'react';
import { EncodedScaledBezierChain } from '@query-curve/builder/dist/@common/types';

// Hooks
import useGraph from '@src/hooks/useGraph';
import useGetContainerDimensions from '@src/hooks/useGetContainerDimensions';

// Components
import InputDecimal from '@src/components/InputDecimal';
import useRefState from '@/src/hooks/useRefState';


type Style = {
  min: number;
  max?: number;
  // CSS styles
  style: CSSProperties;
};

const styles = {
  main: [
    {
      min: 0,
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        overflow: 'hidden',
      },
    },
    {
      min: 950,
      style: {
        flexDirection: 'row',
      },
    },
  ],
  graphInputsArea: [
    {
      min: 0,
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        justifyContent: 'flex-start',
        flex: '0 0 auto',
      },
    },
    {
      min: 950,
      style: {
        flex: '1 1 33%',
      },
    },
  ],
  graphInputs: [
    {
      min: 0,
      style: {
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`,
        gap: '10px',
        padding: '10px',
      },
    },
  ],
  graphInputContainer: [
    {
      min: 0,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 0 5px 0 rgba(0, 0, 0, 0.2)',
        gap: '5px',
      },
    }
  ],
  graphInput: [
    {
      min: 0,
      style: {
        width: '100%',
        padding: '5px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        outline: 'none',
        transition: 'border-color 0.3s',
      },
    },
  ],
  graphInputsAndControlsArea: [
    {
      min: 0,
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        justifyContent: 'flex-start',
        flex: '0 0 auto',
      },
    },
    {
      min: 950,
      style: {
        flex: '1 1 33%',
      },
    },
  ],
  graphControlsArea: [
    {
      min: 0,
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        justifyContent: 'flex-start',
        flex: '0 0 auto',
      },
    },
  ],
  graphControls: [
    {
      min: 0,
      style: {
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`,
        gap: '10px',
        padding: '10px',
      },
    },
  ],
  graphControlsButton: [
    {
      min: 0,
      style: {
        backgroundColor: '#f0c529',
        color: '#203040',
        fontWeight: 600,
        padding: '8px',
        borderRadius: '5px',
      },
    },
  ],
  graphArea: [
    {
      min: 0,
      style: {
        marginTop: '10px',
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#555555',
      },
    },
    {
      min: 950,
      style: {
        flex: '1 1 33%',
      },
    },
  ],
  graphElement: [
    {
      min: 0,
      style: {
        width: '100%',
        flexGrow: 1,
        aspectRatio: '1 / 1',
        minHeight: '300px',
        minWidth: '300px',
        touchAction: 'none',
        boxShadow: '0 0 5px 0 rgba(0, 0, 0, 0.2)',
        borderRadius: '5px',
        overflow: 'hidden',
      },
    },
    {
      min: 950,
      style: {
        width: '750px',
      },
    },
    {
      min: 1050,
      style: {
        width: '800px',
      },
    },
    {
      min: 1150,
      style: {
        width: '850px',
      },
    },
    {
      min: 1200,
      style: {
        width: '950px',
      },
    },
  ],
  chainContainer: [
    {
      min: 0,
      style: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        flex: '0 0 auto',
        marginBottom: '10px',
        padding: '0px 10px',
      },
    },
    {
      min: 950,
      style: {
        padding: '0px 0px',
      },
    },
  ],
  chainInputLabel: [
    {
      min: 0,
      style: {
        flex: '0 0 auto',
        // minWidth: '100px',
        marginRight: '12px',
        fontWeight: 600,
        borderRadius: '5px',
        border: '1px solid #ccc',
        padding: '7px 15px',
      },
    },
  ],
  chainInput: [
    {
      min: 0,
      style: {
        flex: '1 1 auto',
        width: '100%',
        padding: '7px 12px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        outline: 'none',
        transition: 'border-color 0.3s',
        textAlign: 'center',
      },
    },
  ],
  chainCopyButton: [
    {
      min: 0,
      style: {
        flex: '0 0 auto',
        padding: '8px 15px',
        minWidth: '100px',
        borderRadius: '5px',
        backgroundColor: '#f0c529',
        color: '#203040',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        marginLeft: '12px',
      },
    }
  ],
  dataPointInputsContainer: [
    {
      min: 0,
      style: {
        display: 'flex',
        flexDirection: 'column',
        gridColumn: '1/-1', // Span all columns
        gap: '10px',
      },
    },
  ],
  dataPointInputControls: [
    {
      min: 0,
      style: {
        display: 'flex',
        flexDirection: 'row',
        gap: '10px',
        width: '100%',
      },
    },
  ],
  dataPointInputs: [
    {
      min: 0,
      style: {},
    },
  ],
  dataPointButton: [
    {
      min: 0,
      style: {
        padding: '5px 10px',
        borderRadius: '5px',
        backgroundColor: '#f0c529',
        color: '#203040',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        minWidth: '70px',
      },
    },
  ],
} satisfies Record<string, Style[]>;

function applyStyles(styles: Style[], size: number) {
  const sorted = styles.sort((a, b) => a.min - b.min);
  const merged = {} as CSSProperties;
  for (let i = 0; i < sorted.length; i++) {
    const style = sorted[i];
    if (style.min > size) break;
    if (style.max && style.max < size) continue;
    Object.assign(merged, style.style);
  }
  return merged;
}

export default function QueryCurve({
  onChangeEncodedChain,
  initialChain,
}: {
  onChangeEncodedChain?: (encodedChain: EncodedScaledBezierChain) => void,
  initialChain?: EncodedScaledBezierChain | null,
}) {
  const {
    container,
    toggleShowGrid,
    toggleShowPoints,
    toggleShowHandles,
    showGrid,
    showPoints,
    showHandles,
    encodedChain,
    setEncodedChain,
    range,
    gridLinesH,
    gridLinesV,
    setGridLinesH,
    setGridLinesV,
    dataPointInputs,
    setDataPointInputs,
    undo,
  } = (useGraph(initialChain || null)! || {});

  const { ref: successfullyCopied, setValue: setSuccessfullyCopied } = useRefState(0);

  const el = {
    main: useGetContainerDimensions(),
    graphInputsArea: useGetContainerDimensions(),
    graphControlsArea: useGetContainerDimensions(),
  };


  useEffect(() => {
    encodedChain && onChangeEncodedChain?.(encodedChain);
  }, [encodedChain]);

  const copyChain = useCallback(() => {
    if (encodedChain) {
      navigator.clipboard.writeText(encodedChain);
      setSuccessfullyCopied(successfullyCopied.current + 1);
      setTimeout(() => {
        setSuccessfullyCopied(successfullyCopied.current - 1);
      }, 2000);
    }
  }, [encodedChain]);

  const style = {
    main: useMemo(() => applyStyles(styles.main, el.main.width.current || 0), [el.main.width.current]),

    graphInputsArea: useMemo(() => applyStyles(styles.graphInputsArea, el.main.width.current || 0), [el.main.width.current]),
    graphInputs: useMemo(() => applyStyles(styles.graphInputs, el.graphInputsArea.width.current || 0), [el.graphInputsArea.width.current]),
    graphInputContainer: useMemo(() => applyStyles(styles.graphInputContainer, 0), []),
    graphInput: useMemo(() => applyStyles(styles.graphInput, 0), []),

    dataPointInputsContainer: useMemo(() => applyStyles(styles.dataPointInputsContainer, 0), []),
    dataPointInputControls: useMemo(() => applyStyles(styles.dataPointInputControls, 0), []),
    dataPointInputs: useMemo(() => applyStyles(styles.dataPointInputs, 0), []),
    dataPointButton: useMemo(() => applyStyles(styles.dataPointButton, 0), []),

    graphInputsAndControlsArea: useMemo(() => applyStyles(styles.graphInputsAndControlsArea, el.main.width.current || 0), [el.main.width.current]),

    graphControlsArea: useMemo(() => applyStyles(styles.graphControlsArea, el.main.width.current || 0), [el.main.width.current]),
    graphControls: useMemo(() => applyStyles(styles.graphControls, el.graphControlsArea.width.current || 0), [el.graphControlsArea.width.current]),
    graphControlsButton: useMemo(() => applyStyles(styles.graphControlsButton, 0), []),

    graphArea: useMemo(() => applyStyles(styles.graphArea, el.main.width.current || 0), [el.main.width.current]),
    graphElement: useMemo(() => applyStyles(styles.graphElement, el.main.width.current || 0), [el.main.width.current]),

    chainContainer: useMemo(() => applyStyles(styles.chainContainer, el.main.width.current || 0), [el.main.width.current]),
    chainInputLabel: useMemo(() => applyStyles(styles.chainInputLabel, 0), []),
    chainInput: useMemo(() => applyStyles(styles.chainInput, 0), []),
    chainCopyButton: useMemo(() => applyStyles(styles.chainCopyButton, 0), []),
  };

  const dataPointInputComponents = useMemo(() => {
    const filtered = dataPointInputs.filter(({ points }) => Boolean(points));
    filtered.push({ show: true, points: '' });
    filtered.splice(3);
    return filtered.map((dataPointInput, i) => {
      return <div key={i} className={`DataPointInputContainer`} style={style.graphInputContainer}>
        <label className={`DataPointInputLabel`}>Reference Data {i + 1}</label>
        <div className={`DataPointInputControls`} style={style.dataPointInputControls}>
          <input
            className={`DataPointInput`}
            style={style.graphInput}
            value={dataPointInput.points}
            onChange={(e) => {
              const newInputs = [...dataPointInputs];
              newInputs[i] = { ...dataPointInput, points: e.target.value };
              setDataPointInputs(newInputs.filter(({ points }) => Boolean(points)));
            }}
          />
          <button
            className={`DataPointInputButton`}
            style={style.dataPointButton}
            onClick={() => {
              const newInputs = [...dataPointInputs];
              newInputs[i] = { ...dataPointInput, show: !dataPointInput.show };
              setDataPointInputs(newInputs);
            }}
          >{ `${ dataPointInput.show ? 'Hide' : 'Show' }` }</button>
        </div>
      </div>;
    });
  }, [dataPointInputs]);

  const graphInputs = <div className={`GraphInputs`} style={style.graphInputs}>
    <div className={`GraphInputContainer`} style={style.graphInputContainer}>
      <label>X Axis From</label>
      <InputDecimal className={`GraphInput`} style={style.graphInput} value={range.x[0]} onValue={(value) => (value !== null) && range.setX(value, range.x[1])} />
    </div>
    <div className={`GraphInputContainer`} style={style.graphInputContainer}>
      <label>X Axis To</label>
      <InputDecimal className={`GraphInput`} style={style.graphInput} value={range.x[1]} onValue={(value) => (value !== null) && range.setX(range.x[0], value)} />
    </div>
    <div className={`GraphInputContainer`} style={style.graphInputContainer}>
      <label>Y Axis From</label>
      <InputDecimal className={`GraphInput`} style={style.graphInput} value={range.y[0]} onValue={(value) => (value !== null) && range.setY(value, range.y[1])} />
    </div>
    <div className={`GraphInputContainer`} style={style.graphInputContainer}>
      <label>Y Axis To</label>
      <InputDecimal className={`GraphInput`} style={style.graphInput} value={range.y[1]} onValue={(value) => (value !== null) && range.setY(range.y[0], value)} />
    </div>
    <div className={`GraphInputContainer`} style={style.graphInputContainer}>
      <label>Y Grid</label>
      <input className={`GraphInput`} style={style.graphInput} type='number' min={1} max={50} value={gridLinesH} onChange={(e) => setGridLinesH(parseInt(e.target.value))} />
    </div>
    <div className={`GraphInputContainer`} style={style.graphInputContainer}>
      <label>X Grid</label>
      <input className={`GraphInput`} style={style.graphInput} type='number' min={1} max={50} value={gridLinesV} onChange={(e) => setGridLinesV(parseInt(e.target.value))} />
    </div>
    <div className={`GraphInputContainer data-point-inputs`} style={style.dataPointInputsContainer}>
      { dataPointInputComponents }
    </div>
  </div>;

  const graphInputsArea = <div ref={el.graphInputsArea.ref} className={`GraphInputsArea`} style={style.graphInputsArea}>
    { graphInputs }
  </div>;

  const graphControls = <div className={`GraphControls`} style={style.graphControls}>
    <button onClick={undo} style={style.graphControlsButton}>
      Undo
    </button>
    <button onClick={toggleShowGrid} style={style.graphControlsButton}>
      {showGrid ? 'Hide' : 'Show'} Grid
    </button>
    <button onClick={toggleShowPoints} style={style.graphControlsButton}>
      {showPoints ? 'Hide' : 'Show'} Points
    </button>
    <button onClick={toggleShowHandles} style={style.graphControlsButton}>
      {showHandles ? 'Hide' : 'Show'} Handles
    </button>
  </div>;

  const graphControlsArea = <div ref={el.graphControlsArea.ref} className={`GraphControlsArea`} style={style.graphControlsArea}>
    { graphControls }
  </div>;

  return (
    <div
      ref={el.main.ref}
      className='Main'
      style={style.main}
      >
      {
        el.main.width.current && (el.main.width.current >= 1340) && graphInputsArea
      }
      <div className={`GraphArea`} style={style.graphArea}>
        <div className={`ChainContainer`} style={style.chainContainer}>
          <div className={`ChainLabel`} style={style.chainInputLabel}>Your Curve:</div>
          <input className={`ChainInput`} style={style.chainInput} value={encodedChain || ''} onChange={(e) => setEncodedChain(e.target.value)} />
          <button
            className={`ChainCopyButton`}
            style={style.chainCopyButton}
            onClick={copyChain}
          >
            { successfullyCopied.current > 0 ? 'Copied!' : 'Copy' }
          </button>
        </div>
        <div ref={container} style={style.graphElement}></div>
      </div>
      <div className={`GraphInputAndControlsArea`} style={style.graphInputsAndControlsArea}>
        { graphControlsArea }
        {
          el.main.width.current && (el.main.width.current < 1340) && graphInputs
        }
      </div>
    </div>
  );
}
