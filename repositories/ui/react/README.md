# QueryCurve
This is an isolated component/hook for creating a queryable curve, as found on [https://querycurve.com](https://querycurve.com/)

You can place instances of the curve builder component and get the curve output programmatically, to save and ultimately query with one of the query libraries on [npm](https://www.npmjs.com/package/@query-curve/query) or [pip](https://pypi.org/project/query-curve/)

### Installation
`$ npm install --save @query-curve/ui-react`

### Usage

#### All In One Component
```tsx
import { QueryCurve } from '@query-curve/ui-react';

function MyComponent() {
  return <div>
    <QueryCurve />
  </div>;
}
```

This will get you a component with all of the necessary controls:
![Example curve from QueryCurve component](https://querycurve.com/example_component_d.png)

Two optional configurations available are:
```tsx
import { QueryCurve } from '@query-curve/ui-react';

function MyComponent() {
  return <div>
    <QueryCurve
      initialChain={'fxSK-fxSK-0-0-0-fxSK-TN1E-XZAG-CaR6-8OI4-fxSK-0'}
      onChangeEncodedChain={(encodedChain) => {
        console.log(encodedChain);
      }}
    />
  </div>;
}
```

`initialChain` allows you to specify the starting valuve of the curve
`onChangeEncodedChain` allows you to get the new value as you change the curve

#### Barebones Customizable
If you'd like more control over the implementation, you can use the lower level `useGraph` hook.


```tsx
import { useGraph } from '@query-curve/ui-react';

function MyComponent() {
  // The argument for `useGraph` accepts an initialChain, as with the component. Set null to use default.
  const graph = useGraph(null);

  // Graph will return a ref to be assigned to containing element
  return <div ref={graph.container}></div>;
}
```
![Example curve from QueryCurve useGraph hook](https://querycurve.com/example_hook.png)

The controls on the hook object are as follows:
```typescript
{
  container: import("react").MutableRefObject<HTMLDivElement | null>;
  encodedChain: string | null;
  setEncodedChain: (value: import("react").SetStateAction<string | null>) => string | null;
  canSelectHandles: boolean;
  canSelectPoints: boolean;
  showGrid: boolean;
  showHandles: boolean;
  showPoints: boolean;
  toggleShowGrid: () => boolean;
  toggleShowHandles: () => boolean;
  toggleShowPoints: () => boolean;
  toggleSelectHandles: () => boolean;
  toggleSelectPoints: () => boolean;
  range: {
      x: number[];
      y: number[];
      setX: (from: number, to: number) => void;
      setY: (from: number, to: number) => void;
  };
  gridLinesH: number;
  gridLinesV: number;
  setGridLinesH: (value: number) => number;
  setGridLinesV: (value: number) => number;
  dataPointInputs: {
      points: string;
      show: boolean;
  }[];
  setDataPointInputs: (value: import("react").SetStateAction<{
      points: string;
      show: boolean;
  }[]>) => {
      points: string;
      show: boolean;
  }[];
  undo: () => void;
}
```
