import React from "react";
import Seo from "../shared/layout/Seo"
import { PageProps } from "gatsby";
import { SozuPage } from "../features/wait/sozu/pages/SozuPage";

const SozuRoute: React.FC<PageProps> = () => {
  return <SozuPage />;
};

export const Head: React.FC = () => <Seo title="索子多面張シミュレーター" />;
export default SozuRoute;
