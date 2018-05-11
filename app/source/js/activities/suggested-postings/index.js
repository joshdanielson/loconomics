/**
 * Displays a list of suggested GIG postings for the user.
 *
 * @module activities/suggested-postings
 *
 */

import '../../utils/activeViewBindingHandler';
import '../../kocomponents/posting/list';
import '../../kocomponents/posting/suggested';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserPosting from '../../models/UserPosting';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import shell from '../../app.shell';
import { show as showError } from '../../modals/error';
import { list as suggestedPostings } from '../../data/suggestedPostings';
import template from './template.html';

const ROUTE_NAME = 'suggested-postings';

export default class SuggestedPostingsActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSectionNavBar(null);

        this.isLoading = ko.observable(false);
        this.list = ko.observableArray();
        this.userPostingID = ko.observable(null);

        /**
         * Creates link to where to view the posting details
         * @param {rest/UserPosting} item An user posting plain object
         * @returns {string}
         */
        this.linkToViewItem = (item) => `/suggested-postings/${item.userPostingID}`;

        /**
         * Gives null or the posting selected by the instance ID, by filtering
         * the full list.
         * @member {KnockoutComputed<rest/SuggestedPosting>}
         */
        this.selectedPosting = ko.pureComputed(() => {
            const ready = !this.isLoading();
            const id = this.userPostingID();
            if (ready && id) {
                const list = this.list();
                const item = list.find((item) => item.userPostingID === id);
                return new UserPosting(item);
            }
            return null;
        });
        /**
         * Returns the active view
         * @member {KnockoutComputed<string>}
         */
        this.view = ko.pureComputed(() => {
            const id = this.userPostingID();
            return id ? 'item' : 'list';
        });

        this.title = ko.pureComputed(() => {
            switch (this.view()) {
                default:
                case 'list':
                    return 'Suggested postings';
                case 'item':
                    return 'Posting details';
            }
        });

        this.view.subscribe((view) => {
            switch (view) {
                default:
                case 'list':
                    this.navBar.model.updateWith({
                        title: null,
                        leftAction: {
                            link: 'menuIn',
                            icon: 'menu',
                            isMenu: true
                        }
                    });
                    break;
                case 'item':
                    this.navBar.model.updateWith({
                        title: null,
                        leftAction: {
                            link: '/suggested-postings',
                            text: 'Suggested postings',
                            icon: 'fa ion ion-ios-arrow-left',
                            isMenu: false,
                            isShell: false
                        }
                    });
                    break;
            }
        });
    }

    onSelect(item) {
        shell.go(this.linkToViewItem(item));
    }

    show(state) {
        super.show(state);

        this.isLoading(true);
        this.subscribeTo(suggestedPostings.onData, (data) => {
            this.list(data);
            this.isLoading(false);
        });
        this.subscribeTo(suggestedPostings.onDataError, (error) => {
            this.isLoading(false);
            showError({
                title: 'There was an error loading suggested postings',
                error
            });
        });

        // if ID given
        this.userPostingID(state.route.segments[0] |0);
    }

    applyPosting() {
        // TODO
    }
}

activities.register(ROUTE_NAME, SuggestedPostingsActivity);
