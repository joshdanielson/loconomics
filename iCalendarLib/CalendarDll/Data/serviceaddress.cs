//------------------------------------------------------------------------------
// <auto-generated>
//    This code was generated from a template.
//
//    Manual changes to this file may cause unexpected behavior in your application.
//    Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace CalendarDll.Data
{
    using System;
    using System.Collections.Generic;
    
    public partial class serviceaddress
    {
        public int AddressID { get; set; }
        public int UserID { get; set; }
        public int PositionID { get; set; }
        public bool ServicesPerformedAtLocation { get; set; }
        public bool TravelFromLocation { get; set; }
        public string ServiceRadiusFromLocation { get; set; }
        public Nullable<int> TransportType { get; set; }
        public bool PreferredAddress { get; set; }
        public System.DateTime CreatedDate { get; set; }
        public System.DateTime UpdatedDate { get; set; }
        public string ModifiedBy { get; set; }
        public bool Active { get; set; }
    
        public virtual users users { get; set; }
    }
}
