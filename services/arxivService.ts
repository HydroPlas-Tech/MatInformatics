export interface ArxivPaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  link: string;
}

export const searchArxiv = async (query: string, maxResults = 5): Promise<ArxivPaper[]> => {
  try {
    const sanitizedQuery = encodeURIComponent(query);
    // The query parameters part of the ArXiv URL
    const queryParams = `search_query=all:${sanitizedQuery}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
    
    // Strategy 1: Local PHP Proxy (Primary)
    // Strategy 2: AllOrigins (JSON mode)
    // Strategy 3: CORSProxy.io
    const strategies = [
      {
        name: "Local PHP Proxy",
        url: `arxiv_proxy.php?query=${encodeURIComponent(queryParams)}`,
        processor: async (res: Response) => await res.text()
      },
      {
        name: "AllOrigins",
        url: `https://api.allorigins.win/get?url=${encodeURIComponent('http://export.arxiv.org/api/query?' + queryParams)}`,
        processor: async (res: Response) => {
          const data = await res.json();
          return data.contents as string;
        }
      },
      {
        name: "CORSProxy",
        url: `https://corsproxy.io/?${encodeURIComponent('http://export.arxiv.org/api/query?' + queryParams)}`,
        processor: async (res: Response) => await res.text()
      }
    ];

    let xmlText = '';
    let success = false;
    let lastError = null;

    for (const strategy of strategies) {
      try {
        console.log(`Attempting ArXiv fetch via ${strategy.name}...`);
        const response = await fetch(strategy.url);
        
        // If PHP file is missing (404), fetch returns ok=false. 
        // If PHP script runs but fails to get data, it might return 500.
        if (!response.ok) {
           // Specifically for the PHP proxy, if it's 404/500, we just move to next strategy
           console.warn(`${strategy.name} failed with status ${response.status}`);
           continue; 
        }
        
        const content = await strategy.processor(response);
        
        // Basic validation that we got XML/Feed
        if (content && (content.includes('<?xml') || content.includes('<feed') || content.includes('http://www.w3.org/2005/Atom'))) {
          xmlText = content;
          success = true;
          console.log(`Success via ${strategy.name}`);
          break; // Stop if successful
        } else {
            console.warn(`${strategy.name} returned invalid content.`);
        }
      } catch (err) {
        console.warn(`${strategy.name} strategy error:`, err);
        lastError = err;
      }
    }

    if (!success) {
      throw lastError || new Error("All ArXiv fetch strategies failed.");
    }

    // Parse XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const entries = Array.from(xmlDoc.getElementsByTagName("entry"));
    
    return entries.map(entry => {
      // Helper to safely get text content
      const getText = (tag: string) => entry.getElementsByTagName(tag)[0]?.textContent || "";
      
      const id = getText("id");
      const title = getText("title").replace(/\n/g, " ").trim();
      const summary = getText("summary").replace(/\n/g, " ").trim();
      const published = getText("published");
      
      const authors = Array.from(entry.getElementsByTagName("author")).map(
        a => a.getElementsByTagName("name")[0]?.textContent || ""
      );
      
      // Find the PDF link if available, otherwise default ID
      let link = id;
      const linkNodes = Array.from(entry.getElementsByTagName("link"));
      const pdfLink = linkNodes.find(n => n.getAttribute("title") === "pdf");
      if (pdfLink) {
        link = pdfLink.getAttribute("href") || id;
      }

      return {
        id,
        title,
        summary,
        authors,
        published,
        link
      };
    });

  } catch (error) {
    console.error("Failed to fetch from ArXiv:", error);
    // Return empty array so the workflow doesn't crash completely
    return [];
  }
};