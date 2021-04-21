/*
 * React component for scrollspy handling (potentially overkill).
 *
 * Copyright (C) 2020-2021 J.M. Heisz.  All Rights Reserved.
 * See the LICENSE file accompanying the distribution your rights to use
 * this software.
 */
import React from 'react';

/* Inbound properties from the page */
interface ScrollSpyProps {
    /* HTML identifier of the primary object to track */
    track: string;

    /* Required prefix of reference id's to filter */
    id_prefix: string;

    /* Number of points available for the assessment */
    points: number;

    /* Desired offset for scrolling, if needed */
    offset: number;
}

/* State in this instance is just the where we are indicator */
interface ScrollSpyState {
    spiedId: string;
}

/* For type safety, define the tracking structure for the scrolled items */
interface ScrollSpyItem {
    /* Source page assigned identifier for the item */
    id: string;

    /* Textual 'label' for the item (h2 header content) */
    label: string;

    /* Associated header instance */
    target: HTMLElement;
}

/* React component to encapsulate scrollspy for unit sections */
class ScrollSpy extends React.Component<ScrollSpyProps, ScrollSpyState> {
    private scrollItems: ScrollSpyItem[] = [];

    /* This is awkward but need constructor for binding */
    constructor(props: ScrollSpyProps) {
        super(props);

        /* Wowsers... */
        this.linkSelect = this.linkSelect.bind(this);
    }

    /* On mounting the component into the UI, collect target references */
    componentDidMount(): void {
        this.scrollItems = [];
        let main = document.getElementById(this.props.track);
        let refs = main.getElementsByTagName('a');
        for (let idx = 0; idx < refs.length; idx++) {
            let ref = refs[idx];
            if ((ref.id) && (ref.id.startsWith(this.props.id_prefix))) {
                this.scrollItems.push({
                    'id': ref.id,
                    'label': ref.parentElement.textContent,
                    'target': ref.parentElement
                });
            }
        }

        /* Make this potentially optional */
        let assessor = document.getElementById('unit-assessment');
        if (assessor) {
            this.scrollItems.push({
                'id': 'assessment',
                'label': '',
                'target': assessor
            });
        }

        /* Not completely generic, tie to window scrolling */
        window.addEventListener('scroll', () => this.onScroll());

        /* Trigger a scrolling event to set highlight */
        this.onScroll();
    }

    /* Translate scrolling actions to 'spied' highlighting */
    private onScroll(): void {
        let pos = (document.documentElement.scrollTop ||
                                    document.body.scrollTop) +
                  this.props.offset;
        for (let idx = 0; idx < this.scrollItems.length; idx++) {
            let top = (idx == 0) ? 0 : this.scrollItems[idx].target.offsetTop;
            let bot = (idx < (this.scrollItems.length - 1)) ?
                          this.scrollItems[idx + 1].target.offsetTop :
                          999999999999;
            if ((pos >= top) && (pos <= bot)) {
                this.setState({
                    'spiedId': this.scrollItems[idx].id
                });
                return;
            }
        }
    }

    /* And index selections back to original document location */
    private linkSelect(ev: React.MouseEvent<HTMLAnchorElement>) {
        ev.preventDefault();

        /* Find the parent link */
        let trg = ev.target as HTMLElement;
        while ((trg) && (trg.nodeName.toLowerCase() != 'a')) {
            trg = trg.parentElement;
        }
        if (!trg) return;

        /* From there, just scroll the target reference into view */
        let idx = +(trg as HTMLAnchorElement).dataset.item;
        this.scrollItems[idx].target.scrollIntoView({ 'behavior': 'smooth' });

    }

    /* Standard React method to render state-driven component content */
    render(): any {
        return (
          <ul className="scrollspy-list">
            { this.scrollItems.map((item, idx) => {
              return (
                <li key={item.id}
                    className={ 'scrollspy-' + item.id +
                                ((item.id == this.state.spiedId) ?
                                                 ' scrollspy-spied' : '') }>
                  { (item.id != 'assessment') ?
                    <a href="#" data-item={ idx }
                       onClick={ this.linkSelect }>{ item.label }</a> :
                    <a href="#" data-item={ idx }
                       onClick={ this.linkSelect }>
                      <span>Assessment</span>
                      <span className="scrollspy-assessment-points">
                            { this.props.points } Points</span>
                    </a> }
                </li>
              );
            })}
          </ul>
        );
    }
}

export default ScrollSpy;
