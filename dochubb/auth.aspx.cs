using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.ClientServices;
using System.Net;
using System.Collections.Specialized;
using System.Text;
using System.Xml.Linq;



public partial class auth : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {

        if(Request["code"]!=null)
        {
            string code = Request["code"];

            NameValueCollection vc = new NameValueCollection();
            vc.Add("client_id", "100124859d2b615ed99a");
            vc.Add("client_secret", "71a60afcdee5ef6d11115983ec3f0bacc520562e");
            vc.Add("code", code);

            WebClient wc = new WebClient();
            wc.Headers["Accept"] = "text/xml";

            string response =  UTF8Encoding.UTF8.GetString(wc.UploadValues("https://github.com/login/oauth/access_token", vc));

            XDocument xd = XDocument.Parse(response);
            string access_token = xd.Element("OAuth").Element("access_token").Value;

            Response.Redirect("/?access_token=" + access_token);


        }
    }
}