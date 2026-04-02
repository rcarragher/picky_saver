import React from 'react';
import { View } from 'react-native';

const Image = React.forwardRef(function Image(props: any, ref: any) {
  return React.createElement(View, { ...props, ref });
});

(Image as any).prefetch = jest.fn().mockResolvedValue(true);

export { Image };
