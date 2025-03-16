import { BaseHttpDocsProvider } from "./BaseHttpDocsProvider.js";

class HttpDocs2ContextProvider extends BaseHttpDocsProvider {
  static override description = BaseHttpDocsProvider.getDescription('2');
} 

export default HttpDocs2ContextProvider;