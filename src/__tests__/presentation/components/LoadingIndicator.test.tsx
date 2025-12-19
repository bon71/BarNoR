/**
 * LoadingIndicator コンポーネント テスト
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {LoadingIndicator} from '@/presentation/components/common/LoadingIndicator';

describe('LoadingIndicator', () => {
  describe('基本的なレンダリング', () => {
    it('正しくレンダリングされる', () => {
      const {getByTestId} = render(<LoadingIndicator testID="test-loading" />);

      expect(getByTestId('test-loading')).toBeTruthy();
    });

    it('ActivityIndicatorが表示される', () => {
      const {UNSAFE_root} = render(<LoadingIndicator />);

      // ActivityIndicatorの存在を確認（typeで判定）
      const activityIndicator = UNSAFE_root.findAllByType('ActivityIndicator' as any);
      expect(activityIndicator.length).toBeGreaterThan(0);
    });
  });

  describe('メッセージ', () => {
    it('メッセージが表示される', () => {
      const {getByText} = render(
        <LoadingIndicator message="Loading..." />
      );

      expect(getByText('Loading...')).toBeTruthy();
    });

    it('メッセージがない場合、テキストは表示されない', () => {
      const {queryByText} = render(<LoadingIndicator />);

      // メッセージがない場合、どのテキストも表示されないことを確認
      expect(queryByText(/./)).toBeNull();
    });

    it('空文字列のメッセージは表示されない', () => {
      const {queryByText} = render(<LoadingIndicator message="" />);

      // 空文字列は表示されない
      expect(queryByText('')).toBeNull();
    });

    it('複数行のメッセージが表示される', () => {
      const multilineMessage = 'データを読み込んでいます...\nしばらくお待ちください';
      const {getByText} = render(
        <LoadingIndicator message={multilineMessage} />
      );

      expect(getByText(multilineMessage)).toBeTruthy();
    });
  });

  describe('size プロパティ', () => {
    it('size="large"が適用される', () => {
      const {UNSAFE_root} = render(<LoadingIndicator size="large" />);

      const activityIndicator = UNSAFE_root.findByType('ActivityIndicator' as any);
      expect(activityIndicator.props.size).toBe('large');
    });

    it('size="small"が適用される', () => {
      const {UNSAFE_root} = render(<LoadingIndicator size="small" />);

      const activityIndicator = UNSAFE_root.findByType('ActivityIndicator' as any);
      expect(activityIndicator.props.size).toBe('small');
    });

    it('デフォルトsize="large"が適用される', () => {
      const {UNSAFE_root} = render(<LoadingIndicator />);

      const activityIndicator = UNSAFE_root.findByType('ActivityIndicator' as any);
      expect(activityIndicator.props.size).toBe('large');
    });
  });

  describe('color プロパティ', () => {
    it('primary色が適用される', () => {
      const {UNSAFE_root} = render(<LoadingIndicator />);

      const activityIndicator = UNSAFE_root.findByType('ActivityIndicator' as any);
      // colorsはtheme.tsから直接インポートされているので、実際の色値を確認
      expect(activityIndicator.props.color).toBe('#37352F');
    });
  });

  describe('エッジケース', () => {
    it('すべてのpropsなしでもレンダリングされる', () => {
      const {UNSAFE_root} = render(<LoadingIndicator />);

      expect(UNSAFE_root).toBeTruthy();
    });

    it('testIDなしでもレンダリングされる', () => {
      const {UNSAFE_root} = render(<LoadingIndicator message="Loading" />);

      expect(UNSAFE_root).toBeTruthy();
    });

    it('messageとsizeの両方が適用される', () => {
      const {getByText, UNSAFE_root} = render(
        <LoadingIndicator message="Please wait..." size="small" />
      );

      expect(getByText('Please wait...')).toBeTruthy();

      const activityIndicator = UNSAFE_root.findByType('ActivityIndicator' as any);
      expect(activityIndicator.props.size).toBe('small');
    });

    it('長いメッセージでもレンダリングされる', () => {
      const longMessage = 'これは非常に長いローディングメッセージです。データの取得には時間がかかる場合があります。しばらくお待ちください。';
      const {getByText} = render(
        <LoadingIndicator message={longMessage} />
      );

      expect(getByText(longMessage)).toBeTruthy();
    });

    it('特殊文字を含むメッセージが表示される', () => {
      const specialMessage = 'Loading... 読み込み中 🔄 50% ✓';
      const {getByText} = render(
        <LoadingIndicator message={specialMessage} />
      );

      expect(getByText(specialMessage)).toBeTruthy();
    });
  });

  describe('スタイル', () => {
    it('containerスタイルが適用される', () => {
      const {getByTestId} = render(<LoadingIndicator testID="test-loading" />);

      const container = getByTestId('test-loading');
      const styles = container.props.style;

      expect(styles.flex).toBe(1);
      expect(styles.justifyContent).toBe('center');
      expect(styles.alignItems).toBe('center');
    });

    it('メッセージテキストのスタイルが適用される', () => {
      const {getByText} = render(
        <LoadingIndicator message="Loading..." />
      );

      const messageText = getByText('Loading...');
      const styles = messageText.props.style;

      expect(styles.textAlign).toBe('center');
      expect(styles.color).toBe('#787774'); // textSecondary色
    });
  });
});
