import React from 'react';
import { FiChevronUp } from 'react-icons/fi';
import ClearButton from '../styles/clear-button';

const IncrementButton: React.FunctionComponent<
  import('react').HTMLAttributes<HTMLButtonElement>
> = props => (
  <ClearButton type="button" {...props}>
    <FiChevronUp size={32} />
  </ClearButton>
);

export default IncrementButton;