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
        </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
