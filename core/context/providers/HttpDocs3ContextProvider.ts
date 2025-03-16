import { BaseHttpDocsProvider } from "./BaseHttpDocsProvider.js";

export class HttpDocs3ContextProvider extends BaseHttpDocsProvider {
  static override description = BaseHttpDocsProvider.getDescription('3');
} 

export default HttpDocs3ContextProvider;