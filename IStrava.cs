using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.ServiceModel.Activation;
using System.ServiceModel.Web;
using System.Text;

namespace Hyperlapse_GPX
{
   [ServiceContract]
    public interface IStrava
    {
        [OperationContract]
        [WebInvoke(Method = "POST",
               BodyStyle = WebMessageBodyStyle.Wrapped,
               ResponseFormat = WebMessageFormat.Json,
               RequestFormat = WebMessageFormat.Json)]  
        string Auth(string code);

        [OperationContract]
        [WebInvoke(Method = "POST",
               BodyStyle = WebMessageBodyStyle.Wrapped,
               ResponseFormat = WebMessageFormat.Json,
               RequestFormat = WebMessageFormat.Json)]
        string Gpx(string access_token, string id);
    }
}
