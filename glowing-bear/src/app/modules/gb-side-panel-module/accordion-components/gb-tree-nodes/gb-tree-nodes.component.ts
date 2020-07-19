/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {AfterViewChecked, AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {TreeNode} from 'primeng/components/common/api';
import {OverlayPanel} from 'primeng/components/overlaypanel/overlaypanel';
import {animate, style, transition, trigger} from '@angular/animations';
import {TreeNodeService} from '../../../../services/tree-node.service';
import {GbTreeNode} from '../../../../models/tree-node-models/gb-tree-node';

@Component({
  selector: 'gb-tree-nodes',
  templateUrl: './gb-tree-nodes.component.html',
  styleUrls: ['./gb-tree-nodes.component.css'],
  animations: [
    trigger('notifyState', [
      transition('loading => complete', [
        style({
          background: 'rgba(51, 156, 144, 0.5)'
        }),
        animate('500ms ease-out', style({
          background: 'rgba(255, 255, 255, 0.0)'
        }))
      ])
    ])
  ]
})
export class GbTreeNodesComponent implements AfterViewInit, AfterViewChecked {

  @ViewChild('treeNodeMetadataPanel') treeNodeMetadataPanel: OverlayPanel;

  // the observer that monitors the DOM element change on the tree
  observer: MutationObserver;
  // a utility variable storing temporary information on the node that is being expanded
  expansionStatus: any;
  // the variable holding the current metadata overlay content being shown
  metadataContent: any = [];
  // indicate if the initUpdate is finished
  initUpdated: boolean;

  constructor(public treeNodeService: TreeNodeService,
              private element: ElementRef) {
    this.expansionStatus = {
      expanded: false,
      treeNodeElm: null,
      treeNode: null
    };
  }

  ngAfterViewInit() {
    this.observer = new MutationObserver(this.update.bind(this));
    const config = {
      attributes: false,
      subtree: true,
      childList: true,
      characterData: false
    };

    this.observer.observe(this.element.nativeElement, config);
  }

  ngAfterViewChecked() {
    this.initUpdate();
  }

  /**
   * Update the contextmenu popup (right click) content
   * by the given metadata object from a treenode
   * @param metadata
   */
  updateMetadataContent(metadata) {
    this.metadataContent = [];
    for (let key in metadata) {
      this.metadataContent.push({
        key: key,
        val: metadata[key]
      });
    }
  }

  /**
   * Add event listeners to the newly appended tree nodes
   * @param treeNodeElements
   * @param treeNodes
   */
  updateEventListeners(treeNodeElements: Element[], treeNodes: GbTreeNode[]) {
    let index = 0;
    for (let elm of treeNodeElements) {
      let dataObject: GbTreeNode = treeNodes[index];
      let dataObjectType = dataObject.type;
      let metadata = dataObject.metadata;
      let treeNodeElm: Element = elm.querySelector('li.ui-treenode');
      let treeNodeElmLabel: Element = elm.querySelector('li.ui-treenode .ui-treenode-label');
      let handleDragstart = (function (event) {
        event.stopPropagation();
        this.treeNodeService.selectedTreeNode = dataObject;
      }).bind(this);

      let showInfo = (function (event: MouseEvent) {
        this.updateMetadataContent(metadata);
        this.treeNodeMetadataPanel.show(event);
      }).bind(this);

      let hideInfo = (function (event: MouseEvent) {
        this.updateMetadataContent(metadata);
        this.treeNodeMetadataPanel.hide(event);
      }).bind(this);

      // if the data object type belongs to the listed types
      if (this.treeNodeService.validTreeNodeTypes.includes(dataObjectType)) {
        treeNodeElm.addEventListener('dragstart', handleDragstart);
      }
      // if metadata exits
      if (metadata) {
        treeNodeElmLabel.addEventListener('mouseenter', showInfo);
        treeNodeElmLabel.addEventListener('mouseleave', hideInfo);
      }

      let uiTreeNodeChildrenElm = elm.querySelector('.ui-treenode-children');
      if (uiTreeNodeChildrenElm) {
        this.updateEventListeners(Array.from(uiTreeNodeChildrenElm.children), dataObject.children);
      }
      index++;
    }
  }

  initUpdate() {
    if (!this.initUpdated) {
      let treeContainer = this.element.nativeElement.querySelector('.ui-tree-container');
      if (treeContainer) {
        let treeNodeElements: Element[] = Array.from(treeContainer.children);
        if (treeNodeElements && treeNodeElements.length > 0) {
          this.updateEventListeners(treeNodeElements, this.treeNodeService.treeNodes);
          this.initUpdated = true;
        }
      }
    }
  }

  update() {
    if (this.expansionStatus['expanded']) {
      let treeNodeElm = this.expansionStatus['treeNodeElm'];
      let treeNode = this.expansionStatus['treeNode'];
      let newChildren: Element[] = Array.from(treeNodeElm.querySelector('ul.ui-treenode-children').children);
      this.updateEventListeners(newChildren, treeNode.children);

      this.expansionStatus['expanded'] = false;
      this.expansionStatus['treeNodeElm'] = null;
      this.expansionStatus['treeNode'] = null;
    }
  }

  /**
   * Event handler when the user expands one of the tree nodes,
   * once a tree node is expanded,
   * it triggers the MutationObserver to do a further update.
   * @param event
   */
  expandNode(event) {
    if (event.node) {
      this.expansionStatus['expanded'] = true;
      this.expansionStatus['treeNodeElm'] = event.originalEvent.target.parentElement.parentElement;
      this.expansionStatus['treeNode'] = event.node;
    }
  }

  get isLoading(): boolean {
    return !this.treeNodeService.isTreeNodesLoadingCompleted;
  }

}
