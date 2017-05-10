﻿using Braintree;
using System;
using LcEnum;

public partial class LcPayment
{
    public class Membership
    {
        #region Gateway
        private BraintreeGateway _gateway;

        private BraintreeGateway Gateway
        {
			get {
				if (_gateway == null) {
					_gateway = NewBraintreeGateway();
				}
                return _gateway;
			}
        }
        #endregion

        #region Class
        public Membership() { }
        #endregion

        #region Subscription

		public string GetSubscriptionPlanDescriptor(SubscriptionPlan plan)
        {
            switch (plan)
            {
                case SubscriptionPlan.Free:
                    return "Loconomics Free Plan";
                case SubscriptionPlan.OwnerProAnnual:
                    return "Loconomics Owner Pro Annual Plan User Fees";
                case SubscriptionPlan.OwnerPro:
                    return "Loconomics Owner Pro Plan User Fees";
                case SubscriptionPlan.OwnerGrowth:
                    return "Loconomics Owner Growth Plan User Fees";
                default:
                    throw new ArgumentException("Plan value unsupported");
            }
        }

        public Subscription CreateSubscription(int userID, SubscriptionPlan plan, string paymentMethodToken, DateTimeOffset trialEndDate)
        {
            var descriptor = new DescriptorRequest
            {
                Name = GetSubscriptionPlanDescriptor(plan)
            };

            var now = DateTimeOffset.Now;
            var trialDuration = now > trialEndDate ? trialEndDate - now : TimeSpan.Zero;
            var trialDurationDays = trialDuration > TimeSpan.Zero ? (int)Math.Floor(trialDuration.TotalDays) : 0;

            var request = new SubscriptionRequest
            {
				PaymentMethodToken = paymentMethodToken,
				PlanId = plan.ToString(),
				Descriptor = descriptor,
				TrialDuration = trialDurationDays,
				TrialDurationUnit = SubscriptionDurationUnit.DAY,
				HasTrialPeriod = trialDurationDays > 0
			};

			var result = Gateway.Subscription.Create(request);

			if (result.IsSuccess())
            {
                return result.Subscription;
            }
			else
            {
                throw new Exception(result.Message);
            }
		}

        public Subscription GetSubscription(string subscriptionID)
        {
            try
            {
                return Gateway.Subscription.Find(subscriptionID);
            }
			catch (Braintree.Exceptions.NotFoundException)
            {
                return null;
            }
        }

        /// <summary>
        /// Cancel and return a subscription by ID.
        /// Returns null if not found.
        /// </summary>
        /// <param name="subscriptionID"></param>
        /// <returns></returns>
        public Subscription CancelSubscription(string subscriptionID)
        {
            try
            {
                var result = Gateway.Subscription.Cancel(subscriptionID);
                return result.Subscription;
            }
            catch (Braintree.Exceptions.NotFoundException)
            {
                return null;
            }
        }

        #endregion
    }
}