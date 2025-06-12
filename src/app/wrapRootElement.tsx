import React from "react";

import { GatsbyBrowser, GatsbySSR, WrapRootElementNodeArgs } from "gatsby";

import { ProcessingProvider } from "@shared/processing/context/ProcessingContext";

type WrapRootElement = GatsbyBrowser["wrapRootElement"] | GatsbySSR["wrapRootElement"];

export const wrapRootElement: WrapRootElement = ({ element }: WrapRootElementNodeArgs) => (
  <ProcessingProvider>
    { element }
  </ProcessingProvider>
);