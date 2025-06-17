import React from 'react';

import { PageProps } from 'gatsby';

import Seo from '@shared/layout/Seo';

import { RealmViewerPage } from '@features/realmViewer/pages/RealmViewerPage';

const RealmViewerRoute: React.FC<PageProps> = () => {
  return <RealmViewerPage />;
};

export const Head: React.FC = () => <Seo title="領域牌表示ツール" />;
export default RealmViewerRoute;
