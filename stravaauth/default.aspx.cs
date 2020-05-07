using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace Hyperlapse_GPX.stravaauth
{
    public partial class _default : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            var stravaCodeValue = Request.QueryString["code"];

            if(!string.IsNullOrEmpty(stravaCodeValue))
            {
                Response.Cookies.Add(new HttpCookie("strava_code", stravaCodeValue));
                Response.Redirect("/");
            }
        }
    }
}