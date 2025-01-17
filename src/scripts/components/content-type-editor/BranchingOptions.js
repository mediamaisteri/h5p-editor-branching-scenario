import React from 'react';
import PropTypes from 'prop-types';
import './BranchingOptions.scss';

export default class BranchingOptions extends React.Component {

  constructor(props) {
    super(props);

    const initialSelectedMainOption = this.props.nextContentId >= 0
      ? 'old-content'
      : (
        this.props.isInserting
          ? 'new-content'
          : 'end-scenario'
      );

    this.state = {
      expanded: false,
      selectedMainOption: initialSelectedMainOption,
    };
  }

  componentDidMount() {
    if (this.props.feedbackGroup !== undefined) {
      this.props.feedbackGroup.$group.appendTo(this.contentWrapper);
    }
  }

  static getDerivedStateFromProps(props) {
    return ({ // Update selected option
      selectedMainOption: props.nextContentId >= 0
        ? 'old-content'
        : (BranchingOptions.hasFeedback(props) ? 'end-scenario' : 'new-content')
    });
  }

  componentDidUpdate() {
    if (this.props.feedbackGroup !== undefined) {
      if (H5PEditor.Html) {
        H5PEditor.Html.removeWysiwyg();
      }
      this.props.feedbackGroup.$group.appendTo(this.contentWrapper);
      this.props.feedbackGroup.$group.toggle(this.state.selectedMainOption !== 'new-content');

      if (this.state.selectedMainOption !== 'new-content') {
        // Update field labels to match parent option
        this.props.feedbackGroup.$title.html(this.state.selectedMainOption === 'end-scenario' ? 'Customize end scenario' : this.props.feedbackGroup.field.label);
        this.props.feedbackGroup.children[0].$item.find('.h5peditor-label').html(this.state.selectedMainOption === 'end-scenario' ? 'Custom end scenario title' : this.props.feedbackGroup.children[0].field.label);
        this.props.feedbackGroup.children[1].$item.find('.h5peditor-label').html(this.state.selectedMainOption === 'end-scenario' ? 'Custom end scenario text' : this.props.feedbackGroup.children[1].field.label);
        this.props.feedbackGroup.children[2].$item.children('.h5peditor-label-wrapper').children('.h5peditor-label').html(this.state.selectedMainOption === 'end-scenario' ? 'Custom end scenario image' : this.props.feedbackGroup.children[2].field.label);

        const isEndScenario = !(this.props.nextContentId > -1);

        // Cases that need the scoring option field
        const isDynamicScore = (this.props.scoringOption === 'dynamic-score') && !isEndScenario;
        const isStaticScore = (this.props.scoringOption === 'static-end-score') && isEndScenario;

        this.props.feedbackGroup.children[3].$item.toggle(isDynamicScore || isStaticScore);
      }
    }
  }

  static hasFeedback(props) {
    if (props.feedbackGroup === undefined || props.feedbackGroup.params === undefined) {
      return false;
    }
    // Same as view(!)
    return !!(props.feedbackGroup.params.title || props.feedbackGroup.params.subtitle || props.feedbackGroup.params.image || props.feedbackGroup.params.endScreenScore !== undefined);
  }

  handleExistingContentChange = (e) => {
    this.updateContentSelected(e.target.value);
  }

  updateContentSelected = (value) => {
    if (this.props.onChangeContent) {
      this.props.onChangeContent(value);
    }
  }

  handleMainOptionChange = (e) => {
    const newValue = e.target.value;
    this.setState({
      selectedMainOption: newValue,
    });
    switch (newValue) {
      case 'new-content':
        this.updateContentSelected(-1);

        // Clear all feedback values
        if (this.props.feedbackGroup) {
          this.props.feedbackGroup.children[0].$input.val('').change();
          this.props.feedbackGroup.children[1].$input.val('').change();
          this.props.feedbackGroup.children[2].removeImage();
        }
        break;

      case 'end-scenario':
        this.updateContentSelected(-1);

        if (this.props.feedbackGroup && this.props.feedbackGroup.params) {
          // A small hack to make feedback group display again
          this.props.feedbackGroup.params.title = ' ';
        }
        break;

      case 'old-content':
        this.updateContentSelected(this.props.validAlternatives[0].id);
        break;
    }
  }

  render() {
    // TODO: translations
    return (
      <div className='editor-overlay-branching-options'>
        <fieldset className={ 'field group' + (this.state.expanded ? ' expanded' : '' ) }>
          <div
            className="title"
            title="Expand/Collapse"
            role="button"
            onClick={ () => this.setState(prevState => ({expanded: !prevState.expanded})) }
            onKeyPress={ e => { if (e.which === 32) this.setState(prevState => ({expanded: !prevState.expanded}));} }
            tabIndex="0">Branching Options{ /* TODO: l10n */ }
          </div>
          <div className="content" ref={ element => this.contentWrapper = element }>
            <div className='field text importance-low'>
              <label className='h5peditor-label-wrapper'>
                <span className='h5peditor-label'>
                  { this.props.nextContentLabel || 'Special action after this content' }
                </span>
              </label>
              <select
                value={ this.state.selectedMainOption }
                onChange={ this.handleMainOptionChange }
              >
                <option
                  key="default"
                  value="new-content"
                > - </option>
                <option
                  key="end-scenario"
                  value="end-scenario"
                >Custom end scenario</option>
                {
                  this.props.validAlternatives.length > 0 &&
                  <option
                    key="old-content"
                    value="old-content"
                  >Jump to another branch</option>
                }
              </select>
            </div>
            {
              this.props.nextContentId >= 0 &&
              <div className="field text importance-low">
                <label className="h5peditor-label-wrapper" htmlFor="nextPath">
                  <span className="h5peditor-label h5peditor-required">Select a branch to jump to{/* TODO: Use title from semantics */}</span>
                </label>
                <select
                  name="nextPath"
                  value={ this.props.nextContentId }
                  onChange={ this.handleExistingContentChange }
                >
                  {
                    this.props.validAlternatives.map(content => (
                      <option
                        key={ 'next-path-' + content.id }
                        value={ content.id }
                      >{content.label}</option>
                    ))
                  }
                </select>
              </div>
            }
          </div>
        </fieldset>
      </div>
    );
  }
}

BranchingOptions.propTypes = {
  nextContentId: PropTypes.number,
  validAlternatives: PropTypes.array,
  onChangeContent: PropTypes.func
};
