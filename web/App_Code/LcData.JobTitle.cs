﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

/// <summary>
/// Descripción breve de LcData
/// </summary>
public static partial class LcData
{
	public static class JobTitle
    {
        public static dynamic GetJobTitle(int jobTitleID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                var job = db.QuerySingle(@"
                    SELECT
                        PositionID As jobTitleID,
                        PositionSingular As singularName,
                        PositionPlural As pluralName,
                        Aliases As aliases,
                        PositionDescription As description,
                        PositionSearchDescription As searchDescription,
                        CreatedDate As createdDate,
                        UpdatedDate As updatedDate
                    FROM
                        positions
                    WHERE
                        PositionID = @0
                         AND LanguageID = @1
                         AND CountryID = @2
                         AND Active = 1
                ", jobTitleID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());

                if (job == null)
                {
                    return null;
                }
                else
                {
                    var pricings = db.Query(@"
                        SELECT
                            PricingTypeID As pricingTypeID,
                            ClientTypeID As clientTypeID,
                            CreatedDate As createdDate,
                            UpdatedDate As updatedDate
                        FROM
                            positionpricingtype
                        WHERE
                            PositionID = @0
                             AND LanguageID = @1
                             AND CountryID = @2
                             AND Active = 1
                    ", jobTitleID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());

                    // Return an object that includes the collection of pricings
                    return new {
                        jobTitleID = job.jobTitleID,
                        singularName = job.singularName,
                        pluralName = job.pluralName,
                        aliases = job.aliases,
                        description = job.description,
                        searchDescription = job.searchDescription,
                        createdDate = job.createdDate,
                        updatedDate = job.updatedDate,
                        pricingTypes = pricings
                    };
                }
            }
        }

        #region User Job Title relationship
        public static dynamic GetUserJobTitles(int userID, int jobTitleID = -1)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.Query(@"
                    SELECT
                        UserID As userID,
                        PositionID As jobTitleID,
                        PositionIntro As intro,
                        StatusID As statusID,
                        CancellationPolicyID As cancellationPolicyID,
                        InstantBooking As instantBooking,
                        CreateDate As createdDate,
                        UpdatedDate As updatedDate
                    FROM
                        userprofilepositions
                    WHERE
                        UserID = @0
                         AND LanguageID = @1
                         AND CountryID = @2
                         AND Active = 1
                         AND StatusID > 0
                         AND (@3 = -1 OR @3 = PositionID)
                ", userID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID(), jobTitleID);
            }
        }

        public static bool SoftDeleteUserJobTitle(int userID, int jobTitleID)
        {
            using (var db = Database.Open("sqlloco")) {
                // Set StatusID to 0 'deleted by user'
                int affected = db.Execute(@"
                    UPDATE UserProfilePositions SET StatusID = 0
                    WHERE UserID = @0 AND PositionID = @1
                     AND LanguageID = @2
                     AND CountryID = @3
                ", userID, jobTitleID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());

                // Task done? Almost a record must be affected to be a success
                return affected > 1;
            }
        }

        public static bool UpdateUserJobTitle(int userID, int jobTitleID,
            string intro,
            int policyID,
            bool instantBooking)
        {
            var sqlUpdate = @"
                UPDATE  UserProfilePositions
                SET     PositionIntro = @4,
                        CancellationPolicyID = @5,
                        InstantBooking = @6
                WHERE   UserID = @0 AND PositionID = @1
                    AND LanguageID = @2
                    AND CountryID = @3
            ";

            using (var db = Database.Open("sqlloco")) {
                var affected = db.Execute(sqlUpdate,
                    userID,
                    jobTitleID,
                    LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID(),
                    intro,
                    policyID,
                    instantBooking
                );

                // Task done? Almost a record must be affected to be a success
                return affected > 1;
            }
        }

        public static bool DeactivateUserJobTitle(int userID, int jobTitleID)
        {
            using (var db = Database.Open("sqlloco")) {
                // It just update StatusID to 3 'private profile, manual activation'
                var affected = db.Execute(@"
                    UPDATE UserProfilePositions SET StatusID = 3
                    WHERE UserID = @0 AND PositionID = @1
                     AND LanguageID = @2
                     AND CountryID = @3
                ",
                userID, jobTitleID,
                LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());

                // Task done? Almost a record must be affected to be a success
                return affected > 1;
            }
        }
        #endregion
    }
}