﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text;

/// <summary>
/// Descripción breve de LcLogger
/// </summary>
public class LcLogger : IDisposable
{
    StringBuilder logger;
    string logName;
    /// <summary>
    /// Create a new logger.
    /// </summary>
    /// <param name="logName">Name of the log, will be the prefix name of the file</param>
    public LcLogger(string logName)
    {
        logger = new StringBuilder();
        this.logName = logName;
    }
    /// <summary>
    /// Log a text line.
    /// Every line logged include a date-time mark in the start and a new-line character at the end automatically.
    /// Multiline is not allowed in the text, any new-line character is stripped (replaced by a double white space),
    /// to log multi-line preserving original format, use LogData, but remember call previously to Log with a single-line title
    /// to document date-time and subject of the long text/data.
    /// Message is not logged if is a null/empty/whitespace text (date-time mark will not be logged)
    /// </summary>
    /// <param name="format"></param>
    /// <param name="pars"></param>
    public void Log(string format, params object[] pars){
        string str = "";
        try {
            str = String.Format(format.Replace("\n", "  "), pars);
        }
        catch {
            // Catch invalid format messages
            str = String.IsNullOrEmpty(format) ? "**no log message**" : format.Replace("\n", "  ");
        }
        if (String.IsNullOrWhiteSpace(str)) return;
        // Universal date-time, following ISO8601 format with Z identifier at the end
        logger.AppendFormat("{0:s}Z ", DateTime.Now.ToUniversalTime());
        logger.Append(str + "\n");
    }
    /// <summary>
    /// Log an Exception with detailed information and inner exception if exists.
    /// If @ex is null, nothing is logged.
    /// </summary>
    /// <param name="task"></param>
    /// <param name="ex"></param>
    public void LogEx(string task, Exception ex){
        if (ex == null) return;
        Log("{0}: Exception: {1}", task, ex.Message);
        // Exception 'ToString' have full details, exception type, stacktrace, additional data..
        LogData("{0} {1}", ex.ToString(), innerExToString(ex));
    }
    /// <summary>
    /// Log a multiline text.
    /// Remember add a call to Log method before of this with a single-line title
    /// to document date-time and subject of the long text/data added with this method.
    /// Message is not logged if is a null/empty/whitespace text.
    /// </summary>
    /// <param name="format"></param>
    /// <param name="pars"></param>
    public void LogData(string format, params object[] pars)
    {
        string str = "";
        try {
            str = String.Format(format, pars);
        }
        catch {
            // Catch invalid format messages
            str = String.IsNullOrEmpty(format) ? "**no log message**" : format;
        }
        if (String.IsNullOrWhiteSpace(str)) return;
        logger.AppendFormat("[LOGDATA[\n{0}\n]LOGDATA]\n", str);
    }
    string innerExToString(Exception ex){
        if (ex.InnerException != null) {
            return String.Format("\nInnerException: {0}\n{1}{2}", ex.InnerException.Message, ex.InnerException.ToString(), innerExToString(ex.InnerException));
        }
        return "";
    }
    public void Save()
    {
        var text = this.ToString();
        if (!String.IsNullOrEmpty(text))
        {
            string path = String.Format("_logs/{0}{1:yyyyMM}.log.txt", logName, DateTime.Today);
            if (HttpContext.Current != null)
                path = HttpContext.Current.Server.MapPath(LcUrl.RenderAppPath + path);
            System.IO.File.AppendAllText(path, text);
            // Clear saved log
            logger.Clear();
        }
    }
    /// <summary>
    /// Returns the full text logged.
    /// </summary>
    /// <returns></returns>
    public override string ToString()
    {
        return logger.ToString();
    }
    /// <summary>
    /// Free ressources
    /// </summary>
    public void Dispose()
    {
        logger.Clear();
        logger = null;
    }

    #region Static Utilities, common loggers
    public static void LogAspnetError(Exception ex)
    {
        var Request = HttpContext.Current.Request;
        using (var logger = new LcLogger("aspnet-errors"))
        {
            try
            {
                logger.Log("Page error, unhandled exception caugth at Global.asax, context:");
                if (WebMatrix.WebData.WebSecurity.IsAuthenticated)
                {
                    logger.Log("User:: {0}:{1}", WebMatrix.WebData.WebSecurity.CurrentUserId, WebMatrix.WebData.WebSecurity.CurrentUserName);
                }
                else
                {
                    logger.Log("User:: Anonymous");
                }
                logger.Log("Request:: {0} {1}", Request.HttpMethod, Request.RawUrl);
                logger.Log("User-Agent:: {0}", Request.UserAgent);
                try
                {
                    logger.Log("Form Data::");
                    logger.LogData(ASP.LcHelpers.NameValueToString(Request.Form));
                }
                catch { }
                logger.LogEx("Page error details", ex);

                // Send Email too
                LcMessaging.NotifyError("Catch at logger", Request.RawUrl, logger.ToString());
            }
            catch { }
            logger.Save();
        }
    }
    #endregion
}