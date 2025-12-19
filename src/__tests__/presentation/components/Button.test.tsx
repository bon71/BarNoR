/**
 * Button コンポーネントのスナップショットテスト
 */
import React from 'react';
import renderer from 'react-test-renderer';
import {Button} from '@/presentation/components/common/Button';

describe('Button Snapshot', () => {
  it('renders primary button', () => {
    const tree = renderer.create(<Button title="Click Me" onPress={() => {}} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders disabled button', () => {
    const tree = renderer
      .create(<Button title="Disabled" onPress={() => {}} disabled />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders loading button', () => {
    const tree = renderer
      .create(<Button title="Loading" onPress={() => {}} loading />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});


