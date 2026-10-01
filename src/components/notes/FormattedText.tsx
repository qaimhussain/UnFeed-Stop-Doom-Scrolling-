import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

interface FormattedTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  boldStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

/**
 * FormattedText parses simple inline bold markers (**bold text**)
 * using standard React Native Text components without any third-party dependencies.
 */
export const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  style,
  boldStyle,
  numberOfLines,
}) => {
  if (!text) {
    return <Text style={style} numberOfLines={numberOfLines} />;
  }

  // Split by markdown bold markers: **content**
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
          const innerText = part.slice(2, -2);
          return (
            <Text
              key={index}
              style={[
                style,
                { fontWeight: '700' },
                boldStyle,
              ]}
            >
              {innerText}
            </Text>
          );
        }
        return <Text key={index} style={style}>{part}</Text>;
      })}
    </Text>
  );
};
