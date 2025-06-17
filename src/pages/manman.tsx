import React from 'react';

import { PageProps } from 'gatsby';

import Seo from '@shared/layout/Seo';

import { ManmanPage } from '@features/wait/manman/pages/ManmanPage';

const ManmanRoute: React.FC<PageProps> = () => {
  return <ManmanPage />;
};

export const Head: React.FC = () => <Seo title="万万シミュレーター" />;
export default ManmanRoute;
