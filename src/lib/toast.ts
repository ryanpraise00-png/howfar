import Toast from 'react-native-toast-message';

export const showComingSoon = (feature?: string) => {
  Toast.show({
    type: 'info',
    text1: feature ? `${feature}` : 'Coming soon',
    text2: 'This feature will be available in a future update.',
    visibilityTime: 2500,
  });
};

export const showSuccess = (text1: string, text2?: string) => {
  Toast.show({ type: 'success', text1, text2, visibilityTime: 2000 });
};

export const showError = (text1: string, text2?: string) => {
  Toast.show({ type: 'error', text1, text2, visibilityTime: 3000 });
};
