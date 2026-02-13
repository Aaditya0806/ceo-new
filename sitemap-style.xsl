<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:template match="/">
        <html>
        <head><title>XML Sitemap</title></head>
        <body>
            <h2>Website Sitemap</h2>
            <table border="1">
                <tr><th>URL</th><th>Last Modified</th><th>Change Frequency</th><th>Priority</th></tr>
                <xsl:for-each select="urlset/url">
                    <tr>
                        <td><a href="{loc}"><xsl:value-of select="loc"/></a></td>
                        <td><xsl:value-of select="lastmod"/></td>
                        <td><xsl:value-of select="changefreq"/></td>
                        <td><xsl:value-of select="priority"/></td>
                    </tr>
                </xsl:for-each>
            </table>
         <script>
    const form3 = document.getElementById("consultationForm");
  
  form3.addEventListener("submit", function (e) {
    e.preventDefault(); 
  
    const formData3 = new FormData(form3);
  
    const urlEncodedData = new URLSearchParams();
    urlEncodedData.append("name", formData3.get("name"));
    urlEncodedData.append("email", formData3.get("email"));
    urlEncodedData.append("phone", formData3.get("phone"));
    urlEncodedData.append("company", formData3.get("company"));
    urlEncodedData.append("message", formData3.get("description"));
  
    fetch("https://script.google.com/macros/s/AKfycbw_vuKvuu4KNCMrFi9tjklVLq7sb92j7WO7HQ3ofF08kSv_EJcM74_KUS_h8Uf2Y8zc/exec", {
      method: "POST",
      body: urlEncodedData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // alert("Submitted successfully!");
          form3.reset();
        } else {
          // alert("Error: " + data.error);
        }
      })
      .catch((error) => {
        // alert("Network error: " + error.message);
      });
  });
  
  </script>
</body>
        </html>
    </xsl:template>
</xsl:stylesheet>
