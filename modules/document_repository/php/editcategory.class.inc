<?php
/**
 * This class handles a post request to upload a new category.
 * PHP Version 7
 *
 * @category Main
 * @package  Document_Repository
 * @author   Pierre PAC SOO <pierre.pacsoo@mcin.ca>
 * @license  http://www.gnu.org/licenses/gpl-3.0.txt GPLv3
 * @link     https://www.github.com/aces/Loris/
 */
namespace LORIS\document_repository;
use \Psr\Http\Message\ServerRequestInterface;
use \Psr\Http\Message\ResponseInterface;

/**
 * This class handles a post request to upload a new category.
 * PHP Version 7
 *
 * @category Main
 * @package  Document_Repository
 * @author   Pierre PAC SOO <pierre.pacsoo@mcin.ca>
 * @license  http://www.gnu.org/licenses/gpl-3.0.txt GPLv3
 * @link     https://www.github.com/aces/Loris/
 */
class EditCategory extends \NDB_Page
{
    public $skipTemplate = true;

    /**
     * Same as the permissions for the main menu filter page.
     *
     * @param \User $user The user whose access is being checked
     *
     * @return bool true if the user has access to this page.
     */
    function _hasAccess(\User $user) : bool
    {
        return ($user->hasPermission('document_repository_categories')
            && $user->hasAnyPermission(
                [
                    'document_repository_upload',
                    'document_repository_delete',
                ]
            )
        );
    }


    /**
     * Handle a post form
     *
     * @param ServerRequestInterface $request The incoming PSR7 request
     *
     * @return ResponseInterface The outgoing PSR7 response
     */
    public function handle(ServerRequestInterface $request) : ResponseInterface
    {
        if ($request->getMethod() == "POST") {
            $this->editDocCategory($request);
            return (new \LORIS\Http\Response())
                ->withStatus(200)
                ->withHeader("Content-Type", "text/plain")
                ->withBody(
                    new \LORIS\Http\StringStream(
                        json_encode("uploaded successfully")
                    )
                );
        } else {
            return (new \LORIS\Http\Response())
                ->withStatus(405)
                ->withHeader("Content-Type", "text/plain")
                ->withHeader("Allow", "POST");
        }
    }
    /**
     * Handles the upload category process
     *
     * @param ServerRequestInterface $request The incoming PSR7 request
     *
     * @return void
     */
    function editDocCategory($request): void
    {
        $DB          = \Database::singleton();
        $req         = $request->getParsedBody();
        $category_id = isset($req['categoryID']) ? $req['categoryID'] : null;
        $new_name    = isset($req['categoryNameChange']) ?
            $req['categoryNameChange'] : null;
        $new_parent  = isset($req['newParentID']) ? $req['newParentID'] : null;

        if ($new_parent != null) {
            $DB->run(
                "UPDATE document_repository_categories
                    SET category_name=\"$new_name\", parent_id=$new_parent
                    WHERE id=$category_id"
            );
        } else {
            $DB->run(
                "UPDATE document_repository_categories
                    SET category_name=\"$new_name\"
                    WHERE id=$category_id"
            );
        }
    }
}