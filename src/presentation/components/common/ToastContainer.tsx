/**
 * トーストコンテナコンポーネント
 * 複数のトーストメッセージを管理・表示
 */

import React from 'react';
import {View, StyleSheet, SafeAreaView} from 'react-native';
import {Toast} from './Toast';
import {useToastStore} from '@/presentation/stores/useToastStore';

export const ToastContainer: React.FC = () => {
  const {toasts, hideToast} = useToastStore();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <View style={styles.toastList} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <View
            key={toast.id}
            style={[styles.toastWrapper, {top: index * 70}]}
            pointerEvents="box-none">
            <Toast
              id={toast.id}
              type={toast.type}
              message={toast.message}
              duration={toast.duration}
              onHide={hideToast}
            />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toastList: {
    flex: 1,
    pointerEvents: 'box-none',
  },
  toastWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    pointerEvents: 'box-none',
  },
});
