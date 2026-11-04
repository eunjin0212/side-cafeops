import { ActivityIndicator } from 'react-native';

import { CenteredScreen } from '@/components/molecules/CenteredScreen';

export interface LoadingScreenProps {
  background?: string;
}

export function LoadingScreen({ background }: LoadingScreenProps) {
  return (
    <CenteredScreen background={background}>
      <ActivityIndicator aria-label="Loading" size="large" />
    </CenteredScreen>
  );
}
