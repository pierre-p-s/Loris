import {Tabs, TabPane} from 'Tabs';
import DocUploadForm from './uploadForm';
import DocCategoryForm from './categoryForm';
import ParentTree from './parentTree';
import ChildTree from './childTree';
import Loader from 'Loader';
import FilterableDataTable from 'FilterableDataTable';
import NullFilterableDataTable from './NullFilterableDataTable';

class DocIndex extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      data: {},
      error: false,
      newCategory: false,
      tableData: [],
      childrenNode: [],
      parentNode: [],
      global: false,
    };
    // Bind component instance to custom methods
    this.handleGlobal = this.handleGlobal.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.formatColumn = this.formatColumn.bind(this);
    this.newCategoryState = this.newCategoryState.bind(this);
    this.getAllData = this.getAllData.bind(this);
    this.dataByNode = this.dataByNode.bind(this);
    this.getContent = this.getContent.bind(this);
  }

  componentDidMount() {
    this.fetchData()
      .then(() => this.setState({isLoaded: true}));
  }

  htmlSpecialCharsDecode(text) {
    if (text != null) {
      return text
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
    } else {
      return text;
    }
  }

  handleGlobal(formElement, value) {
    const parentNode = this.state.parentNode;
    parentNode.shift(['0', 'Root']);
    this.setState({parentNode});
    if (value == true) {
      this.getAllData();
    } else {
      this.dataByNode(0);
    }
  }

  getAllData() {
    return fetch(loris.BaseURL + '/document_repository/docTree/0')
      .then((response) => response.json())
      .then((myJson) => {
        let allNodesArray = [];
        let nodesArray = [];
        allNodesArray = myJson['allsubcategories'];
        allNodesArray.forEach((element) => {
          nodesArray.push(Object.values(element).toString());
        });
        let filterData = this.state.data.Data;
        let fillData = filterData.filter((data) => {
          return Object.values(nodesArray).includes(data[10]);
        });
        this.setState({
          global: true,
          tableData: fillData,
          childrenNode: [],
          parentNode: [],
        });
      });
  }

  // function change tableData;
  dataByNode(id) {
    return fetch(loris.BaseURL + '/document_repository/docTree/' + id)
      .then((response) => response.json())
      .then((myJson) => {
        let allNodesArray = [];
        let nodesArray = [];
        allNodesArray = myJson['allsubcategories'];
        allNodesArray.forEach((element) => {
          nodesArray.push(id);
        });
        let filterData = this.state.data.Data;
        let fillData = filterData.filter((data) => {
          return Object.values(nodesArray).includes(data[10]);
        });
        this.setState({
          global: false,
          tableData: fillData,
          childrenNode: myJson['subcategories'],
          parentNode: myJson['parentcategory'],
        });
      });
  }

  fetchData() {
    return fetch(this.props.dataURL, {credentials: 'same-origin'})
      .then((resp) => resp.json())
      .then((data) => {
        this.setState({data: data, tableData: data.Data});
      }).then(() => {
        this.dataByNode(0);
      })
      .then(() => this.setState({newCategory: false}))
      .catch((error) => {
        this.setState({error: true});
      });
  }

  getContent(obj) {
    this.dataByNode(obj[0]);
  }

  newCategoryState() {
    this.setState({newCategory: true});
  }

  /**
   * Modify behaviour of specified column cells in the Data Table component
   * @param {string} column - column name
   * @param {string} cell - cell content
   * @param {arrray} row - array of cell contents for a specific row
   * @return {*} a formated table cell for a given column
   */
  formatColumn(column, cell, row) {
    cell = this.htmlSpecialCharsDecode(cell);
    let result = <td>{cell}</td>;
    switch (column) {
      case 'File Name':
        let fileName = this.htmlSpecialCharsDecode(row['File Name']);
        let downloadURL = loris.BaseURL + '/document_repository/Files/' + encodeURIComponent(fileName);
        result = <td><a href={downloadURL} target="_blank" download={fileName}>{cell}</a></td>;
        break;
      case 'Edit':
        let editURL = loris.BaseURL + '/document_repository/edit/' + row['Edit'];
        result = <td><a href={editURL}>Edit</a></td>;
        break;
      case 'Delete File':
        let id = row['Edit'];
        function click() {
          swal({
            title: 'Are you sure?',
            text: 'Your will not be able to recover this file!',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn-danger',
            confirmButtonText: 'Yes, delete it!',
            closeOnConfirm: false,
          },
          function() {
            let deleteurl = loris.BaseURL + '/document_repository/Files/' + id;
              fetch(deleteurl, {
              method: 'DELETE',
              cache: 'no-cache',
              credentials: 'same-origin',
              }).then((resp) => resp.json())
                .then(()=>{
                  location.reload();
                  swal('delete Successful!', '', 'success');
                });
          }
          );
        }
        result = <td><a style={{cursor: 'pointer'}} onClick={click}>Delete</a></td>;
        break;
    }
    return result;
  }

  render() {
    // If error occurs, return a message.
    // XXX: Replace this with a UI component for 500 errors.
    if (this.state.error) {
      return <h3>An error occured while loading the page.</h3>;
    }

    // Waiting for async data to load
    if (!this.state.isLoaded) {
      return <Loader/>;
    }
    const options = this.state.data.fieldOptions;
    const fields = [
      {label: 'File Name', show: true, filter: {
        name: 'fileName',
        type: 'text',
      }},
      {label: 'Version', show: true, filter: {
        name: 'version',
        type: 'text',
      }},
      {label: 'File Type', show: true, filter: {
        name: 'fileTypes',
        type: 'select',
        options: options.fileTypes,
      }},
      {label: 'Instrument', show: false},
      {label: 'Uploaded By', show: true, filter: {
        name: 'uploadedBy',
        type: 'text',
        }},
      {label: 'For Site', show: true, filter: {
        name: 'site',
        type: 'select',
        options: options.sites,
      }},
      {label: 'Comments', show: true, filter: {
        name: 'Comments',
        type: 'text',
      }},
      {label: 'Date Uploaded', show: true},
      {label: 'Edit', show: true},
      {label: 'Delete File', show: this.props.hasPermission('superUser') || this.props.hasPermission('document_repository_delete')},
      {label: 'File Category', show: false},
      {label: 'Category', show: false},
      {label: 'Data Dir', show: false},
    ];

    let tabList = [
      {id: 'browse', label: 'Browse'},
    ];
    let uploadDoc;
    let uploadCategory;
    if (loris.userHasPermission('document_repository_view')) {
      tabList.push(
        {
          id: 'upload',
          label: 'Upload',
        },
      );
      tabList.push(
        {
          id: 'category',
          label: 'Category',
        },
      );

      uploadDoc = (
        <TabPane TabId={tabList[1].id}>
          <DocUploadForm
            dataURL={`${loris.BaseURL}/document_repository/?format=json`}
            action={`${loris.BaseURL}/document_repository/Files`}
            maxUploadSize={this.state.data.maxUploadSize}
            refreshPage={this.fetchData}
            category={this.state.newCategory}
          />
        </TabPane>
      );

      uploadCategory = (
        <TabPane TabId={tabList[2].id}>
          <DocCategoryForm
            dataURL={`${loris.BaseURL}/document_repository/?format=json`}
            action={`${loris.BaseURL}/document_repository/UploadCategory`}
            refreshPage={this.fetchData}
            newCategoryState={this.newCategoryState}
          />
        </TabPane>
      );
    }
    const parentTree = this.state.global ? null : (
      <div>
        <ParentTree
          action={this.getContent}
          parentNode={this.state.parentNode}
        />
      </div>
    );
    const treeTable = (Object.keys(this.state.tableData.length).length === 0
                        && Object.keys(this.state.childrenNode).length === 0) ? (
      <NullFilterableDataTable>
        <div>
          <CheckboxElement
            name="globalSelection"
            label="Filter globally"
            id="globalSelection"
            value={this.state.global}
            elementClass='checkbox-inline'
            onUserInput={this.handleGlobal}
          />
          <FilterableDataTable
            name = "document"
            data={this.state.tableData}
            fields={fields}
            getFormattedCell={this.formatColumn}
            folder={
              <ChildTree
                action={this.getContent}
                childrenNode={this.state.childrenNode}
              />
            }
          >
          {parentTree}
          </FilterableDataTable>
        </div>
      </NullFilterableDataTable>
    ) : (
      <div>
        <CheckboxElement
          name="globalSelection"
          label="Filter globally"
          id="globalSelection"
          value={this.state.global}
          elementClass='checkbox-inline'
          onUserInput={this.handleGlobal}
        />
        <FilterableDataTable
          name = "document"
          data={this.state.tableData}
          fields={fields}
          getFormattedCell={this.formatColumn}
          nullTableShow={true}
          folder={
          <ChildTree
            action={this.getContent}
            childrenNode={this.state.childrenNode}
          />}
        >
        {parentTree}
        </FilterableDataTable>
      </div>
    );

    return (
      <Tabs tabs={tabList} defaultTab="browse" updateURL={true}>
        <TabPane TabId={tabList[0].id}>
          {treeTable}
        </TabPane>
        {uploadDoc}
        {uploadCategory}
      </Tabs>
    );
  }
}

window.addEventListener('load', () => {
  ReactDOM.render(
    <div className="page-document">
    <DocIndex
      dataURL={`${loris.BaseURL}/document_repository/?format=json`}
      hasPermission={loris.userHasPermission}
    />
    </div>,
    document.getElementById('lorisworkspace')
  );
});
