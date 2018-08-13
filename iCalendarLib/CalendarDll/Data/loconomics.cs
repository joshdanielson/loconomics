﻿//------------------------------------------------------------------------------
// <auto-generated>
//    Este código se generó a partir de una plantilla.
//
//    Los cambios manuales en este archivo pueden causar un comportamiento inesperado de la aplicación.
//    Los cambios manuales en este archivo se sobrescribirán si se regenera el código.
// </auto-generated>
//------------------------------------------------------------------------------

using System;
using System.Collections.Generic;

public partial class address
{
    public int AddressID { get; set; }
    public int UserID { get; set; }
    public int AddressTypeID { get; set; }
    public string AddressName { get; set; }
    public string AddressLine1 { get; set; }
    public string AddressLine2 { get; set; }
    public string City { get; set; }
    public int StateProvinceID { get; set; }
    public int PostalCodeID { get; set; }
    public int CountryID { get; set; }
    public Nullable<double> Latitude { get; set; }
    public Nullable<double> Longitude { get; set; }
    public string GoogleMapsURL { get; set; }
    public string SpecialInstructions { get; set; }
    public System.DateTime CreatedDate { get; set; }
    public System.DateTime UpdatedDate { get; set; }
    public string ModifiedBy { get; set; }
    public Nullable<bool> Active { get; set; }
}

public partial class addresstype
{
    public int AddressTypeID { get; set; }
    public int LanguageID { get; set; }
    public int CountryID { get; set; }
    public string AddressType1 { get; set; }
    public System.DateTime CreatedDate { get; set; }
    public System.DateTime UpdatedDate { get; set; }
    public string ModifiedBy { get; set; }
    public bool Active { get; set; }
    public bool UniquePerUser { get; set; }
    public bool Selectable { get; set; }
}

public partial class CalendarAvailabilityType
{
    public CalendarAvailabilityType()
    {
        this.CalendarEvents = new HashSet<CalendarEvents>();
    }

    public int CalendarAvailabilityTypeID { get; set; }
    public int LanguageID { get; set; }
    public int CountryID { get; set; }
    public string CalendarAvailabilityTypeName { get; set; }
    public string CalendarAvailabilityTypeDescription { get; set; }
    public string SelectableAs { get; set; }

    public virtual ICollection<CalendarEvents> CalendarEvents { get; set; }
}

public partial class CalendarEventComments
{
    public int Id { get; set; }
    public int IdEvent { get; set; }
    public string Comment { get; set; }

    public virtual CalendarEvents CalendarEvents { get; set; }
}

public partial class CalendarEventExceptionsPeriod
{
    public int IdException { get; set; }
    public System.DateTimeOffset DateStart { get; set; }
    public Nullable<System.DateTimeOffset> DateEnd { get; set; }

    public virtual CalendarEventExceptionsPeriodsList CalendarEventExceptionsPeriodsList { get; set; }
}

public partial class CalendarEventExceptionsPeriodsList
{
    public CalendarEventExceptionsPeriodsList()
    {
        this.CalendarEventExceptionsPeriod = new HashSet<CalendarEventExceptionsPeriod>();
    }

    public int Id { get; set; }
    public int IdEvent { get; set; }

    public virtual CalendarEvents CalendarEvents { get; set; }
    public virtual ICollection<CalendarEventExceptionsPeriod> CalendarEventExceptionsPeriod { get; set; }
}

public partial class CalendarEventRecurrencesPeriod
{
    public int IdRecurrence { get; set; }
    public System.DateTimeOffset DateStart { get; set; }
    public Nullable<System.DateTimeOffset> DateEnd { get; set; }

    public virtual CalendarEventRecurrencesPeriodList CalendarEventRecurrencesPeriodList { get; set; }
}

public partial class CalendarEventRecurrencesPeriodList
{
    public CalendarEventRecurrencesPeriodList()
    {
        this.CalendarEventRecurrencesPeriod = new HashSet<CalendarEventRecurrencesPeriod>();
    }

    public int Id { get; set; }
    public int IdEvent { get; set; }

    public virtual CalendarEvents CalendarEvents { get; set; }
    public virtual ICollection<CalendarEventRecurrencesPeriod> CalendarEventRecurrencesPeriod { get; set; }
}

public partial class CalendarEvents
{
    public CalendarEvents()
    {
        this.CalendarEventComments = new HashSet<CalendarEventComments>();
        this.CalendarEventExceptionsPeriodsList = new HashSet<CalendarEventExceptionsPeriodsList>();
        this.CalendarEventRecurrencesPeriodList = new HashSet<CalendarEventRecurrencesPeriodList>();
        this.CalendarEventsAttendees = new HashSet<CalendarEventsAttendees>();
        this.CalendarEventsContacts = new HashSet<CalendarEventsContacts>();
        this.CalendarReccurrence = new HashSet<CalendarReccurrence>();
    }

    public int Id { get; set; }
    public int UserId { get; set; }
    public string Summary { get; set; }
    public string UID { get; set; }
    public int CalendarAvailabilityTypeID { get; set; }
    public bool Transparency { get; set; }
    public System.DateTimeOffset StartTime { get; set; }
    public System.DateTimeOffset EndTime { get; set; }
    public bool IsAllDay { get; set; }
    public Nullable<System.DateTimeOffset> StampTime { get; set; }
    public string TimeZone { get; set; }
    public Nullable<int> Priority { get; set; }
    public string Location { get; set; }
    public Nullable<System.DateTimeOffset> UpdatedDate { get; set; }
    public Nullable<System.DateTimeOffset> CreatedDate { get; set; }
    public string ModifyBy { get; set; }
    public string Class { get; set; }
    public string Organizer { get; set; }
    public Nullable<int> Sequence { get; set; }
    public string Geo { get; set; }
    public Nullable<System.DateTimeOffset> RecurrenceId { get; set; }
    public Nullable<System.TimeSpan> TimeBlock { get; set; }
    public Nullable<int> DayofWeek { get; set; }
    public string Description { get; set; }
    public Nullable<System.DateTimeOffset> Deleted { get; set; }
    public int EventType { get; set; }

    public virtual CalendarAvailabilityType CalendarAvailabilityType { get; set; }
    public virtual ICollection<CalendarEventComments> CalendarEventComments { get; set; }
    public virtual ICollection<CalendarEventExceptionsPeriodsList> CalendarEventExceptionsPeriodsList { get; set; }
    public virtual ICollection<CalendarEventRecurrencesPeriodList> CalendarEventRecurrencesPeriodList { get; set; }
    public virtual users users { get; set; }
    public virtual ICollection<CalendarEventsAttendees> CalendarEventsAttendees { get; set; }
    public virtual ICollection<CalendarEventsContacts> CalendarEventsContacts { get; set; }
    public virtual ICollection<CalendarReccurrence> CalendarReccurrence { get; set; }
    public virtual CalendarEventType CalendarEventType { get; set; }
}

public partial class CalendarEventsAttendees
{
    public int Id { get; set; }
    public int IdEvent { get; set; }
    public string Attendee { get; set; }
    public string Role { get; set; }
    public string Uri { get; set; }

    public virtual CalendarEvents CalendarEvents { get; set; }
}

public partial class CalendarEventsContacts
{
    public int Id { get; set; }
    public int IdEvent { get; set; }
    public string Contact { get; set; }

    public virtual CalendarEvents CalendarEvents { get; set; }
}

public partial class CalendarEventType
{
    public CalendarEventType()
    {
        this.CalendarEvents = new HashSet<CalendarEvents>();
    }

    public int EventTypeId { get; set; }
    public string EventType { get; set; }
    public string Description { get; set; }
    public string DisplayName { get; set; }

    public virtual ICollection<CalendarEvents> CalendarEvents { get; set; }
}

public partial class CalendarProviderAttributes
{
    public int UserID { get; set; }
    public decimal AdvanceTime { get; set; }
    public decimal MinTime { get; set; }
    public decimal MaxTime { get; set; }
    public decimal BetweenTime { get; set; }
    public bool UseCalendarProgram { get; set; }
    public string CalendarType { get; set; }
    public string CalendarURL { get; set; }
    public string PrivateCalendarToken { get; set; }

    public virtual users users { get; set; }
}

public partial class CalendarReccurrence
{
    public CalendarReccurrence()
    {
        this.CalendarReccurrenceFrequency = new HashSet<CalendarReccurrenceFrequency>();
    }

    public int ID { get; set; }
    public Nullable<int> EventID { get; set; }
    public Nullable<int> Count { get; set; }
    public string EvaluationMode { get; set; }
    public Nullable<int> Frequency { get; set; }
    public Nullable<int> Interval { get; set; }
    public Nullable<int> RestristionType { get; set; }
    public Nullable<System.DateTimeOffset> Until { get; set; }
    public Nullable<int> FirstDayOfWeek { get; set; }

    public virtual ICollection<CalendarReccurrenceFrequency> CalendarReccurrenceFrequency { get; set; }
    public virtual CalendarEvents CalendarEvents { get; set; }
}

public partial class CalendarReccurrenceFrequency
{
    public int ID { get; set; }
    public Nullable<int> CalendarReccursiveID { get; set; }
    public Nullable<bool> ByDay { get; set; }
    public Nullable<bool> ByHour { get; set; }
    public Nullable<bool> ByMinute { get; set; }
    public Nullable<bool> ByMonth { get; set; }
    public Nullable<bool> ByMonthDay { get; set; }
    public Nullable<bool> BySecond { get; set; }
    public Nullable<bool> BySetPosition { get; set; }
    public Nullable<bool> ByWeekNo { get; set; }
    public Nullable<bool> ByYearDay { get; set; }
    public Nullable<int> ExtraValue { get; set; }
    public Nullable<int> FrequencyDay { get; set; }
    public Nullable<int> DayOfWeek { get; set; }

    public virtual CalendarReccurrence CalendarReccurrence { get; set; }
}

public partial class country
{
    public int CountryID { get; set; }
    public int LanguageID { get; set; }
    public string CountryName { get; set; }
    public string CountryCode { get; set; }
    public string CountryCallingCode { get; set; }
    public Nullable<System.DateTime> CreatedDate { get; set; }
    public Nullable<System.DateTime> UpdatedDate { get; set; }
    public string ModifiedBy { get; set; }
    public bool Active { get; set; }
}

public partial class county
{
    public int CountyID { get; set; }
    public string CountyName { get; set; }
    public Nullable<int> FIPSCode { get; set; }
    public int StateProvinceID { get; set; }
    public System.DateTime CreatedDate { get; set; }
    public System.DateTime UpdatedDate { get; set; }
    public string ModifiedBy { get; set; }
    public bool Active { get; set; }
}

public partial class language
{
    public int LanguageID { get; set; }
    public int CountryID { get; set; }
    public string LanguageName { get; set; }
    public Nullable<bool> Active { get; set; }
    public string LanguageCode { get; set; }
    public Nullable<System.DateTime> CreatedDate { get; set; }
    public Nullable<System.DateTime> UpdatedDate { get; set; }
    public string ModifiedBy { get; set; }
}

public partial class postalcode
{
    public int PostalCodeID { get; set; }
    public string PostalCode1 { get; set; }
    public string City { get; set; }
    public int StateProvinceID { get; set; }
    public int CountryID { get; set; }
    public Nullable<double> Latitude { get; set; }
    public Nullable<double> Longitude { get; set; }
    public Nullable<decimal> TimeZone { get; set; }
    public Nullable<bool> DST { get; set; }
    public string Location { get; set; }
    public string PostalCodeType { get; set; }
    public Nullable<System.DateTime> CreatedDate { get; set; }
    public Nullable<System.DateTime> UpdatedDate { get; set; }
    public string ModifiedBy { get; set; }
}

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

public partial class stateprovince
{
    public int StateProvinceID { get; set; }
    public string StateProvinceName { get; set; }
    public string StateProvinceCode { get; set; }
    public int CountryID { get; set; }
    public string RegionCode { get; set; }
    public string PostalCodePrefix { get; set; }
}

public partial class sysdiagrams
{
    public string name { get; set; }
    public int principal_id { get; set; }
    public int diagram_id { get; set; }
    public Nullable<int> version { get; set; }
    public byte[] definition { get; set; }
}

public partial class transporttype
{
    public int TransportTypeID { get; set; }
    public int LanguageID { get; set; }
    public int CountryID { get; set; }
    public string TransportTypeName { get; set; }
    public string TransportTypeDescription { get; set; }
    public System.DateTime CreatedDate { get; set; }
    public System.DateTime UpdatedDate { get; set; }
    public string ModifiedBy { get; set; }
    public bool Active { get; set; }
}

public partial class users
{
    public users()
    {
        this.serviceaddress = new HashSet<serviceaddress>();
        this.CalendarEvents = new HashSet<CalendarEvents>();
    }

    public int UserID { get; set; }
    public string FirstName { get; set; }
    public string MiddleIn { get; set; }
    public string LastName { get; set; }
    public string SecondLastName { get; set; }
    public string NickName { get; set; }
    public string PublicBio { get; set; }
    public int GenderID { get; set; }
    public Nullable<int> PreferredLanguageID { get; set; }
    public Nullable<int> PreferredCountryID { get; set; }
    public Nullable<bool> IsProvider { get; set; }
    public Nullable<bool> IsCustomer { get; set; }
    public Nullable<bool> IsAdmin { get; set; }
    public string Photo { get; set; }
    public string MobilePhone { get; set; }
    public string AlternatePhone { get; set; }
    public string ProviderProfileURL { get; set; }
    public bool SMSBookingCommunication { get; set; }
    public bool PhoneBookingCommunication { get; set; }
    public bool LoconomicsMarketingCampaigns { get; set; }
    public bool ProfileSEOPermission { get; set; }
    public Nullable<System.DateTime> CreatedDate { get; set; }
    public Nullable<System.DateTime> UpdatedDate { get; set; }
    public string ModifiedBy { get; set; }
    public bool Active { get; set; }
    public bool LoconomicsCommunityCommunication { get; set; }
    public Nullable<bool> IAuthZumigoVerification { get; set; }
    public Nullable<bool> IAuthZumigoLocation { get; set; }
    public bool LoconomicsDBMCampaigns { get; set; }
    public int AccountStatusID { get; set; }
    public bool CoBrandedPartnerPermissions { get; set; }
    public string ProviderWebsiteURL { get; set; }
    public string MarketingSource { get; set; }

    public virtual CalendarProviderAttributes CalendarProviderAttributes { get; set; }
    public virtual ICollection<serviceaddress> serviceaddress { get; set; }
    public virtual ICollection<CalendarEvents> CalendarEvents { get; set; }
}

public partial class GetProviderAvailabilityFullSet_Result
{
    public Nullable<System.DateTime> DateSet { get; set; }
    public Nullable<int> DayOfWeek { get; set; }
    public Nullable<System.TimeSpan> TimeBlock { get; set; }
    public Nullable<System.DateTime> DT { get; set; }
    public Nullable<int> CalendarAvailabilityTypeID { get; set; }
}

public partial class sp_helpdiagramdefinition_Result
{
    public Nullable<int> version { get; set; }
    public byte[] definition { get; set; }
}

public partial class sp_helpdiagrams_Result
{
    public string Database { get; set; }
    public string Name { get; set; }
    public int ID { get; set; }
    public string Owner { get; set; }
    public int OwnerID { get; set; }
}
