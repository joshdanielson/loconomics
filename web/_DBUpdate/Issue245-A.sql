/****** Object:  StoredProcedure [dbo].[TestProfileActivation]    Script Date: 05/29/2013 16:41:23 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		Iago Lorenzo Salgueiro
-- Create date: 2012-06-01
-- Description: Check what alerts are 
-- actived, updating the Profile Activation
-- Percentage of the User and enabling or 
-- disabling the user profile depending on the
-- result.
-- To check all the user profile (that means
-- all the provider position related alerts
-- and the basic user and customer alerts) pass
-- a PositionID=0.
-- =============================================
ALTER PROCEDURE [dbo].[TestProfileActivation]
	@UserID int,
	@PositionID int = 0
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    DECLARE @cur CURSOR
    
    IF @PositionID = 0 BEGIN
		SET @cur = CURSOR FOR 
			SELECT DISTINCT
			 PositionID
			FROM
			 UserProfilePositions
			WHERE
		     UserID = @UserID
		     AND PositionID <> 0
			 
		OPEN @cur
		FETCH NEXT FROM @cur INTO @PositionID
		WHILE @@FETCH_STATUS = 0 BEGIN
			-- Execute this same proc but for a concrete positionID
			EXEC TestProfileActivation @UserID, @PositionID
			
			FETCH NEXT FROM @cur INTO @PositionID
		END
		CLOSE @cur
		DEALLOCATE @cur

    END ELSE BEGIN
		/* IMPORTANT NOTE:
		 If profile is in status 0 'deleted' (or any minor 0, 'internal visibility')
		 do nothing.
		 If profile is in status 3 'private profile, manual activation'
		 do nothing because the user doesn't want its profile activated right now
		 */
		-- THEN, we only enter to check the profile if
		-- the StatusID is 2 'private profile, automatic activation'
		IF 2 = (SELECT TOP 1 StatusID FROM UserProfilePositions
				WHERE UserID = @UserID AND PositionID = @PositionID)
		BEGIN	
			-- If all required tests passed, activate user profile for that position
			UPDATE UserProfilePositions SET
				StatusID = 
				-- Check that required alerts was passed
				CASE WHEN (SELECT count(*)
					FROM UserAlert As UA
						 INNER JOIN
						Alert As A
						  ON UA.AlertID = A.AlertID
					WHERE UA.UserID = @UserID
							AND
						  -- All tests, including user tests (PositionID=0) and
						  -- specific position tests must be passed
						  (UA.PositionID = 0 OR UA.PositionID = @PositionID)
							AND
						  A.Required = 1
							AND
						  UA.Active = 1
				) = 0 THEN 1 -- Public profile
				ELSE 2 -- Private profile, automatic activation
				END
			WHERE	
				UserID = @UserID AND PositionID = @PositionID
		END
	END
END
